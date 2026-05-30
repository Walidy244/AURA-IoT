#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi Credentials
const char* ssid = "pele";
const char* password = "fayez123?";

// API Configuration
const char* apiBase = "http://192.168.14.94:8080/api";
const char* ledStateEndpoint = "/led/state";   // GET {r,g,b}

// LED Pin Configuration - RGB LED on GPIO 18, 19, 21 (safe GPIO with PWM)
#define PIN_R 18         // Red channel
#define PIN_G 19         // Green channel
#define PIN_B 21         // Blue channel
#define LED_PWM_FREQ 5000
#define LED_PWM_RES 8    // 8-bit (0-255)
#define COMMON_ANODE false

// Timing
unsigned long lastLedCheck = 0;
const unsigned long LED_CHECK_INTERVAL = 5000; // 5 seconds

// Function Prototypes
void setupWiFi();
void checkLedTimer();
void testLedPins();
void printHttpError(int httpCode);
void writeRgb(int r, int g, int b);
void setLedColor(String color, int brightness);
void sendHttpRequest(String endpoint, String payload);

void setup() {
  Serial.begin(115200);
  delay(100);
  
  Serial.println("\n\nStarting Aura IoT ESP32...");
  
  // Initialize RGB LED PWM channels
  ledcSetup(0, LED_PWM_FREQ, LED_PWM_RES);
  ledcAttachPin(PIN_R, 0);
  ledcSetup(1, LED_PWM_FREQ, LED_PWM_RES);
  ledcAttachPin(PIN_G, 1);
  ledcSetup(2, LED_PWM_FREQ, LED_PWM_RES);
  ledcAttachPin(PIN_B, 2);
  
  // Turn the LED off initially
  writeRgb(0, 0, 0);

  // Quick hardware test: red, green, blue, then off.
  // If this shows no light, the issue is wiring/pins/common anode-cathode, not the API.
  testLedPins();
  
  // Connect to WiFi
  setupWiFi();
}

void loop() {
  unsigned long currentTime = millis();
  handleSerialInput();
  
  // Check LED state every LED_CHECK_INTERVAL
  if (currentTime - lastLedCheck >= LED_CHECK_INTERVAL) {
    lastLedCheck = currentTime;
    checkLedTimer();
  }
  
  delay(100);
}

/**
 * Handle Serial Input for Testing
 */
void handleSerialInput() {
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    command.toUpperCase();
    
    Serial.print("\n[TEST] Command: ");
    Serial.println(command);
    
    if (command == "RED") {
      Serial.println("  → Setting RED (255, 0, 0)");
      writeRgb(255, 0, 0);
      delay(500);
    } 
    else if (command == "GREEN") {
      Serial.println("  → Setting GREEN (0, 255, 0)");
      writeRgb(0, 255, 0);
      delay(500);
    } 
    else if (command == "BLUE") {
      Serial.println("  → Setting BLUE (0, 0, 255)");
      writeRgb(0, 0, 255);
      delay(500);
    } 
    else if (command == "WHITE") {
      Serial.println("  → Setting WHITE (255, 255, 255)");
      writeRgb(255, 255, 255);
      delay(500);
    }
    else if (command == "OFF") {
      Serial.println("  → Setting OFF (0, 0, 0)");
      writeRgb(0, 0, 0);
      delay(500);
    } 
    else if (command == "TEST") {
      Serial.println("  → Running hardware test...");
      testLedPins();
    }
    else if (command == "STATUS") {
      Serial.println("  → Fetching from API...");
      checkLedTimer();
    }
    else {
      Serial.println("  Commands: RED, GREEN, BLUE, WHITE, OFF, TEST, STATUS");
    }
  }
}

/**
 * Setup WiFi Connection
 */
void setupWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("✓ WiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("✗ Failed to connect to WiFi");
  }
}

/**
 * Check LED timer status from API
 */
void checkLedTimer() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected");
    return;
  }
  
  HTTPClient http;
  String url = String(apiBase) + "/led/state";

  Serial.print("GET ");
  Serial.println(url);
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);
  
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String response = http.getString();
    
    // Parse JSON
    DynamicJsonDocument doc(256);
    deserializeJson(doc, response);
    
    int r = doc["r"] | 0;
    int g = doc["g"] | 0;
    int b = doc["b"] | 0;

    writeRgb(r, g, b);

    Serial.print("LED RGB: ");
    Serial.print(r);
    Serial.print(",");
    Serial.print(g);
    Serial.print(",");
    Serial.println(b);
  } else {
    Serial.print("HTTP Error: ");
    Serial.println(httpCode);
    printHttpError(httpCode);
  }
  
  http.end();
}

void testLedPins() {
  Serial.println("Testing RGB LED pins...");

  Serial.println("Testing RED on GPIO " + String(PIN_R));
  writeRgb(255, 0, 0);
  delay(700);

  Serial.println("Testing GREEN on GPIO " + String(PIN_G));
  writeRgb(0, 255, 0);
  delay(700);

  Serial.println("Testing BLUE on GPIO " + String(PIN_B));
  writeRgb(0, 0, 255);
  delay(700);

  writeRgb(0, 0, 0);
}

void writeRgb(int r, int g, int b) {
  r = constrain(r, 0, 255);
  g = constrain(g, 0, 255);
  b = constrain(b, 0, 255);

  if (COMMON_ANODE) {
    r = 255 - r;
    g = 255 - g;
    b = 255 - b;
  }

  ledcWrite(0, r);
  ledcWrite(1, g);
  ledcWrite(2, b);
  
  // DEBUG OUTPUT
  Serial.print("[writeRgb DEBUG] Input: ("); Serial.print(constrain(r, 0, 255)); 
  Serial.print(","); Serial.print(constrain(g, 0, 255)); 
  Serial.print(","); Serial.print(constrain(b, 0, 255)); 
  Serial.println(")");
}

void printHttpError(int httpCode) {
  if (httpCode == HTTPC_ERROR_CONNECTION_REFUSED) {
    Serial.println("Connection refused. Check Django is running on 0.0.0.0:8080 and Windows Firewall allows port 8080.");
  } else if (httpCode == HTTPC_ERROR_CONNECTION_LOST) {
    Serial.println("Connection lost while talking to the server.");
  } else if (httpCode == HTTPC_ERROR_NOT_CONNECTED) {
    Serial.println("Not connected to the HTTP server. The ESP32 cannot reach 192.168.14.94:8080 from WiFi.");
  } else if (httpCode == HTTPC_ERROR_READ_TIMEOUT) {
    Serial.println("Read timeout. The server accepted the connection but did not answer in time.");
  } else {
    Serial.println("Unknown HTTP client error.");
  }
}

/**
 * Set LED Color (simple implementation)
 * Maps colors to PWM brightness levels
 */
void setLedColor(String color, int brightness) {
  int pwmValue = constrain(brightness, 0, 255);

  if (color == "off") {
    writeRgb(0, 0, 0);
    Serial.println("LED: OFF");
    return;
  }

  if (color == "red") {
    writeRgb(pwmValue, 0, 0);
  } else if (color == "green") {
    writeRgb(0, pwmValue, 0);
  } else if (color == "blue") {
    writeRgb(0, 0, pwmValue);
  } else if (color == "white") {
    writeRgb(pwmValue, pwmValue, pwmValue);
  } else if (color == "yellow") {
    writeRgb(pwmValue, pwmValue, 0);
  } else if (color == "cyan") {
    writeRgb(0, pwmValue, pwmValue);
  } else if (color == "magenta") {
    writeRgb(pwmValue, 0, pwmValue);
  } else if (color == "rgb") {
    // Use existing values already written in checkLedTimer
    Serial.println("LED: RGB values applied");
    return;
  } else {
    Serial.println("Unknown color");
    return;
  }

  Serial.print("LED: ");
  Serial.print(color);
  Serial.print(" at ");
  Serial.print(pwmValue);
  Serial.println(" brightness");
}

/**
 * Send HTTP POST Request to API
 */
void sendHttpRequest(String endpoint, String payload) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected");
    return;
  }
  
  HTTPClient http;
  String url = String(apiBase) + endpoint;
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  int httpCode = http.POST(payload);
  
  if (httpCode == 200 || httpCode == 201) {
    Serial.print("✓ Request successful: ");
    Serial.println(endpoint);
  } else {
    Serial.print("✗ HTTP Error ");
    Serial.print(httpCode);
    Serial.print(": ");
    Serial.println(endpoint);
  }
  
  String response = http.getString();
  if (response.length() > 0) {
    Serial.println("Response: " + response);
  }
  
  http.end();
}


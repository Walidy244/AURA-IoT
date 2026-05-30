// Simple RGB LED Diagnostic Test
// Upload this to test each LED channel independently

#define PIN_R 18         // Red channel
#define PIN_G 19         // Green channel
#define PIN_B 21         // Blue channel
#define LED_PWM_FREQ 5000
#define LED_PWM_RES 8    // 8-bit (0-255)

void setup() {
  Serial.begin(115200);
  delay(500);
  
  Serial.println("\n\n=== RGB LED DIAGNOSTIC TEST ===\n");
  
  // Initialize PWM channels
  ledcSetup(0, LED_PWM_FREQ, LED_PWM_RES);
  ledcAttachPin(PIN_R, 0);
  Serial.println("✓ Red channel setup (GPIO 27, Channel 0)");
  
  ledcSetup(1, LED_PWM_FREQ, LED_PWM_RES);
  ledcAttachPin(PIN_G, 1);
  Serial.println("✓ Green channel setup (GPIO 26, Channel 1)");
  
  ledcSetup(2, LED_PWM_FREQ, LED_PWM_RES);
  ledcAttachPin(PIN_B, 2);
  Serial.println("✓ Blue channel setup (GPIO 25, Channel 2)");
  
  Serial.println("\nTesting each channel at FULL BRIGHTNESS (255)...\n");
  
  // Test RED
  Serial.println(">> Testing RED (500ms)...");
  ledcWrite(0, 255);  // Red channel full
  ledcWrite(1, 0);    // Green off
  ledcWrite(2, 0);    // Blue off
  delay(500);
  ledcWrite(0, 0);
  Serial.println("   (LED should show PURE RED)\n");
  
  delay(500);
  
  // Test GREEN
  Serial.println(">> Testing GREEN (500ms)...");
  ledcWrite(0, 0);    // Red off
  ledcWrite(1, 255);  // Green channel full
  ledcWrite(2, 0);    // Blue off
  delay(500);
  ledcWrite(1, 0);
  Serial.println("   (LED should show PURE GREEN)\n");
  
  delay(500);
  
  // Test BLUE
  Serial.println(">> Testing BLUE (500ms)...");
  ledcWrite(0, 0);    // Red off
  ledcWrite(1, 0);    // Green off
  ledcWrite(2, 255);  // Blue channel full
  delay(500);
  ledcWrite(2, 0);
  Serial.println("   (LED should show PURE BLUE)\n");
  
  delay(500);
  
  // Test WHITE
  Serial.println(">> Testing WHITE (500ms)...");
  ledcWrite(0, 255);  // Red full
  ledcWrite(1, 255);  // Green full
  ledcWrite(2, 255);  // Blue full
  delay(500);
  ledcWrite(0, 0);
  ledcWrite(1, 0);
  ledcWrite(2, 0);
  Serial.println("   (LED should show WHITE)\n");
  
  Serial.println("=== TEST COMPLETE ===");
  Serial.println("\nResults:");
  Serial.println("- If ONLY GREEN shows: Check GPIO 27 (RED) and GPIO 25 (BLUE) connections");
  Serial.println("- If colors appear wrong: Try changing COMMON_ANODE flag in main code");
  Serial.println("- If nothing shows: Check power and GND connections");
}

void loop() {
  delay(10);
}

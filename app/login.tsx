import { FontAwesome, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from "expo-linking";
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { getApiPath } from './api';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();

  // State variables ready for Node.js backend integration
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const res = await fetch(getApiPath('api/login/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const text = await res.text();
      let body: any = text;
      try { body = JSON.parse(text); } catch (e) {}

      if (!res.ok) {
        const msg = (body && body.detail) ? body.detail : text || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      if (body && body.token) {
        await AsyncStorage.setItem('authToken', body.token);
      }

      router.replace('/');
    } catch (err) {
      console.error('Login failed', err);
      alert('Login failed: ' + (err as any).message);
    }
  };

useEffect(() => {
  const handleDeepLink = (event: any) => {
    const url = event.url;
    const parsed = Linking.parse(url);

   const code = parsed.queryParams?.code;

if (typeof code === "string") {
  console.log("Auth Code:", code);
  exchangeCodeForToken(code);
}
  };

  const subscription = Linking.addEventListener("url", handleDeepLink);

  return () => subscription.remove();
}, []);

const exchangeCodeForToken = async (code: string) => {
  try {
    const response = await fetch(
      "https://aura-auth.auth.us-east-1.amazoncognito.com/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `grant_type=authorization_code&client_id=3pi274k5pr67284m2f2a173pai&code=${code}&redirect_uri=myapp://callback`,
      }
    );

    const data = await response.json();
    console.log("Tokens:", data);

    // ✅ Save tokens (important)
    // access_token, id_token, refresh_token

    // Navigate to home
    router.replace("/");
  } catch (error) {
    console.error("Token error:", error);
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          
          <View style={styles.logoContainer}>
            <View style={styles.placeholderLogo}>
               <Ionicons name="shield-checkmark" size={width * 0.15} color="#E8C382" />
            </View>
            <Text style={styles.brandName}>AURA</Text>
            <Text style={styles.tagline}>Connect. Control. Live.</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Log in to your account</Text>

            <TextInput 
              style={styles.input}
              placeholder="email@domain.com"
              placeholderTextColor="#8E8E93"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <TextInput 
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#8E8E93"
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.forgotPasswordContainer}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.continueButton} 
              activeOpacity={0.7}
              onPress={handleLogin}
            >
              <Text style={styles.continueText}>Log In</Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              <FontAwesome name="google" size={20} color="#DB4437" style={styles.socialIcon} />
              <Text style={styles.socialButtonText}>Log in with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              <FontAwesome name="apple" size={22} color="black" style={styles.socialIcon} />
              <Text style={styles.socialButtonText}>Log in with Apple</Text>
            </TouchableOpacity>

            {/* Navigation back to Signup Screen */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/signup' as any)}>
                <Text style={styles.signupText}>Sign up</Text>
              </TouchableOpacity>
            </View>

          </View>

          <View style={{ height: 40 }} />

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1227', 
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: width * 0.08, 
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.08, 
    marginBottom: height * 0.05,
  },
  placeholderLogo: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  brandName: {
    fontSize: width * 0.1, 
    fontWeight: 'bold',
    color: '#E8C382', 
    letterSpacing: 2,
  },
  tagline: {
    color: '#E8C382',
    fontSize: 14,
    marginTop: -5,
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    color: '#D1D1D6',
    fontSize: 14,
    marginBottom: 25,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 55,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  forgotPasswordContainer: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#E8C382',
    fontSize: 14,
    fontWeight: '600',
  },
  continueButton: {
    width: '100%',
    height: 55,
    backgroundColor: '#E8C382',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  continueText: {
    color: '#3A3A3C',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#3A3A3C',
  },
  dividerText: {
    color: '#8E8E93',
    marginHorizontal: 10,
  },
  socialButton: {
    width: '100%',
    height: 55,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  socialIcon: {
    marginRight: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  footerContainer: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#D1D1D6',
    fontSize: 14,
  },
  signupText: {
    color: '#E8C382',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

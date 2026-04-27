import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Linking,
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

const { width, height } = Dimensions.get('window');

export default function SignupScreen() {
  const router = useRouter();

  // State variables ready for Node.js backend integration
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignup = () => {
  const url =
    "https://aura-auth.auth.us-east-1.amazoncognito.com/signup" +
    "?client_id=YOUR_CLIENT_ID" +
    "&redirect_uri=myapp://callback" +
    "&response_type=code" +
    "&scope=openid+email+profile";

  Linking.openURL(url);
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up for your account</Text>

            <TextInput 
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#8E8E93"
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
            />

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

            <TextInput 
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#8E8E93"
              secureTextEntry
              autoCapitalize="none"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity 
              style={styles.continueButton} 
              activeOpacity={0.7}
              onPress={handleSignup}
            >
              <Text style={styles.continueText}>Sign Up</Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              <FontAwesome name="google" size={20} color="#DB4437" style={styles.socialIcon} />
              <Text style={styles.socialButtonText}>Sign up with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              <FontAwesome name="apple" size={22} color="black" style={styles.socialIcon} />
              <Text style={styles.socialButtonText}>Sign up with Apple</Text>
            </TouchableOpacity>

            {/* Navigation back to Login Screen */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.signupText}>Log in</Text>
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
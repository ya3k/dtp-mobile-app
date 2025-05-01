import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useAuth from '@/hooks/useAuth';
import { loginSchema } from '@/schemaValidation/auth.schema';
import { useUserStore } from '@/store/userStore';

const LoginScreen = () => {
  const URLFE = process.env.EXPO_FE_URL;
  const router = useRouter();
  const navigation = useNavigation();
  const { login, waitForAuth } = useAuth();
  const { fetchUserProfile } = useUserStore();
  // Form state
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ userName?: string; password?: string }>({});
  const [loginError, setLoginError] = useState<string | null>(null);

  // Validate form fields
  const validateField = (field: 'userName' | 'password', value: string) => {
    try {
      loginSchema.shape[field].parse(value);
      setErrors(prev => ({ ...prev, [field]: undefined }));
      return true;
    } catch (error: any) {
      const message = error.errors?.[0]?.message || `Invalid ${field}`;
      setErrors(prev => ({ ...prev, [field]: message }));
      return false;
    }
  };

  // Handle form submission
  const handleLogin = async () => {
    setLoginError(null);

    // Validate all fields
    const isUserNameValid = validateField('userName', userName);
    const isPasswordValid = validateField('password', password);

    if (!isUserNameValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);

    try {
      // Login first
      await login({ userName, password });

      // Wait for auth state to be fully applied
      const isAuthenticated = await waitForAuth();

      if (isAuthenticated) {
        // Fetch user profile after successful login
        await fetchUserProfile();

        // Navigate to home screen on success
        if (navigation.canGoBack()) {
          navigation.goBack()
        } else {
          router.replace('/(tabs)');
        }
      } else {
        setLoginError('Authentication failed. Please try again.');
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Đăng nhập thất bại. Vui lòng thử lại.';

      setLoginError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    const registerURL = `${process.env.EXPO_PUBLIC_FE_URL}/register`;
    // Navigate to the WebView with the external URL
    router.push({
      pathname: '/(auth)/external-webview',
      params: {
        url: registerURL,
        title: 'Đăng Ký'
      }
    });
  }

  const forgotPassword = () => {
    const forgotPW = `${process.env.EXPO_PUBLIC_FE_URL}/forgot-password`;
    // Navigate to the WebView with the external URL
    router.push({
      pathname: '/(auth)/external-webview',
      params: {
        url: forgotPW,
        title: 'Quên mật khẩu'
      }
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Đăng Nhập</Text>
            <Text style={styles.subtitle}>Đăng nhập để tiếp tục</Text>
          </View>

          {/* Error message */}
          {loginError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{loginError}</Text>
            </View>
          )}

          <View style={styles.form}>
            {/* Username field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tên đăng nhập</Text>
              <View style={[styles.inputWrapper, errors.userName && styles.inputError]}>
                <Ionicons name="person-outline" size={20} color="#777" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập tên đăng nhập"
                  value={userName}
                  onChangeText={(text) => {
                    setUserName(text);
                    validateField('userName', text);
                  }}
                  autoCapitalize="none"
                />
              </View>
              {errors.userName && <Text style={styles.errorText}>{errors.userName}</Text>}
            </View>

            {/* Password field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mật khẩu</Text>
              <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color="#777" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mật khẩu"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    validateField('password', text);
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#777"
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <TouchableOpacity style={styles.forgotPassword} onPress={forgotPassword}>
              <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Đăng Nhập</Text>
              )}
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Chưa có tài khoản? </Text>
              <TouchableOpacity onPress={handleRegister}>
                <Text style={styles.registerLink}>Đăng ký</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#444',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 15,
    height: 55,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 8,
  },
  inputError: {
    borderColor: '#ff4d4f',
  },
  errorText: {
    fontSize: 14,
    color: '#ff4d4f',
    marginTop: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#15B6CB',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#15B6CB',
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonDisabled: {
    backgroundColor: '#97e1ea',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 15,
    color: '#666',
  },
  registerLink: {
    fontSize: 15,
    color: '#15B6CB',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#fff0f0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ffccc7',
  },
})

export default LoginScreen;
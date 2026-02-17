// Mi Negocio AVEMARÍA — Login Screen (Mobile)

import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { colors } from '../theme';
import { useAuthStore } from '../authStore';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading, error, clearError } = useAuthStore();

    const handleLogin = async () => {
        try {
            await login(email, password);
        } catch { }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.card}>
                <Text style={styles.brand}>AVEMARÍA</Text>
                <Text style={styles.subtitle}>Mi Negocio</Text>

                <View style={styles.form}>
                    <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={(v) => { clearError(); setEmail(v); }}
                        placeholder="yo@minegocio.com"
                        placeholderTextColor={colors.ink4}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <Text style={[styles.label, { marginTop: 16 }]}>CONTRASEÑA</Text>
                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={(v) => { clearError(); setPassword(v); }}
                        placeholder="••••••••"
                        placeholderTextColor={colors.ink4}
                        secureTextEntry
                    />

                    {error && (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.button, isLoading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>INGRESAR</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={styles.footer}>AVEMARÍA © 2026</Text>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.cream,
        justifyContent: 'center',
        padding: 24,
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: 24,
        padding: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 32,
        elevation: 8,
    },
    brand: {
        fontSize: 28,
        fontWeight: '500',
        color: colors.ink,
        textAlign: 'center',
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 12,
        color: colors.ink3,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 4,
        marginTop: 4,
        marginBottom: 32,
    },
    form: {},
    label: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.ink3,
        letterSpacing: 1.5,
        marginBottom: 6,
    },
    input: {
        fontSize: 15,
        color: colors.ink,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.gold3,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.6)',
    },
    errorBox: {
        marginTop: 16,
        padding: 12,
        borderRadius: 8,
        backgroundColor: colors.redBg,
        borderWidth: 1,
        borderColor: 'rgba(192,57,43,0.15)',
    },
    errorText: {
        fontSize: 13,
        color: colors.red2,
        textAlign: 'center',
    },
    button: {
        marginTop: 24,
        backgroundColor: colors.gold,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 2,
    },
    footer: {
        textAlign: 'center',
        marginTop: 24,
        fontSize: 11,
        color: colors.ink4,
        letterSpacing: 1,
    },
});

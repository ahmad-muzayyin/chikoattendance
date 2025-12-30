import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { Portal, Dialog, Button, Text, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CustomAlertProps {
    visible: boolean;
    onDismiss: () => void;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
    visible,
    onDismiss,
    title,
    message,
    type = 'info',
    confirmText = 'OK',
    cancelText,
    onConfirm,
    onCancel
}) => {
    const getIcon = () => {
        switch (type) {
            case 'success':
                return { name: 'check-circle', color: '#10B981' };
            case 'error':
                return { name: 'alert-circle', color: '#EF4444' };
            case 'warning':
                return { name: 'alert', color: '#F59E0B' };
            default:
                return { name: 'information', color: '#3B82F6' };
        }
    };

    const icon = getIcon();

    return (
        <Portal>
            <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
                <View style={styles.iconContainer}>
                    <View style={[styles.iconCircle, { backgroundColor: `${icon.color}15` }]}>
                        <MaterialCommunityIcons
                            name={icon.name as any}
                            size={48}
                            color={icon.color}
                        />
                    </View>
                </View>

                <Dialog.Title style={styles.title}>{title}</Dialog.Title>
                <Dialog.Content>
                    <Text style={styles.message}>{message}</Text>
                </Dialog.Content>

                <Dialog.Actions style={styles.actions}>
                    {cancelText && onCancel && (
                        <Button
                            mode="outlined"
                            onPress={() => {
                                onCancel();
                                onDismiss();
                            }}
                            style={styles.cancelButton}
                            labelStyle={styles.cancelButtonText}
                        >
                            {cancelText}
                        </Button>
                    )}
                    <Button
                        mode="contained"
                        onPress={() => {
                            if (onConfirm) onConfirm();
                            onDismiss();
                        }}
                        style={[styles.confirmButton, { backgroundColor: icon.color }]}
                        labelStyle={styles.confirmButtonText}
                    >
                        {confirmText}
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
};

const styles = StyleSheet.create({
    dialog: {
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        paddingVertical: 8,
    },
    iconContainer: {
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 8,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 8,
    },
    message: {
        textAlign: 'center',
        fontSize: 15,
        color: '#6B7280',
        lineHeight: 22,
        paddingHorizontal: 8,
    },
    actions: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 8,
        gap: 8,
    },
    cancelButton: {
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        paddingVertical: 4,
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#6B7280',
    },
    confirmButton: {
        borderRadius: 12,
        paddingVertical: 4,
        elevation: 0,
    },
    confirmButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface RadioOption {
    label: string;
    value: string;
    description?: string;
    icon?: string;
}

interface CustomRadioButtonProps {
    label?: string;
    options: RadioOption[];
    value: string;
    onSelect: (value: string) => void;
    direction?: 'vertical' | 'horizontal';
}

export const CustomRadioButton: React.FC<CustomRadioButtonProps> = ({
    label,
    options,
    value,
    onSelect,
    direction = 'vertical'
}) => {
    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[
                styles.optionsContainer,
                direction === 'horizontal' && styles.optionsHorizontal
            ]}>
                {options.map((option) => {
                    const isSelected = value === option.value;

                    return (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.option,
                                isSelected && styles.optionSelected,
                                direction === 'horizontal' && styles.optionHorizontal
                            ]}
                            onPress={() => onSelect(option.value)}
                            activeOpacity={0.7}
                        >
                            {/* Radio Circle */}
                            <View style={styles.radioContainer}>
                                <View style={[
                                    styles.radioOuter,
                                    isSelected && styles.radioOuterSelected
                                ]}>
                                    {isSelected && (
                                        <View style={styles.radioInner} />
                                    )}
                                </View>
                            </View>

                            {/* Icon (Optional) */}
                            {option.icon && (
                                <View style={[
                                    styles.iconContainer,
                                    isSelected && styles.iconContainerSelected
                                ]}>
                                    <MaterialCommunityIcons
                                        name={option.icon as any}
                                        size={20}
                                        color={isSelected ? '#EC1616' : '#6B7280'}
                                    />
                                </View>
                            )}

                            {/* Label & Description */}
                            <View style={styles.textContainer}>
                                <Text style={[
                                    styles.optionLabel,
                                    isSelected && styles.optionLabelSelected
                                ]}>
                                    {option.label}
                                </Text>
                                {option.description && (
                                    <Text style={styles.optionDescription}>
                                        {option.description}
                                    </Text>
                                )}
                            </View>

                            {/* Checkmark (when selected) */}
                            {isSelected && (
                                <MaterialCommunityIcons
                                    name="check-circle"
                                    size={20}
                                    color="#EC1616"
                                    style={styles.checkIcon}
                                />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    optionsContainer: {
        gap: 8,
    },
    optionsHorizontal: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 14,
        paddingHorizontal: 16,
        minHeight: 56,
    },
    optionSelected: {
        backgroundColor: '#FEF2F2',
        borderColor: '#EC1616',
    },
    optionHorizontal: {
        flex: 1,
        minWidth: '48%',
        marginRight: 8,
    },
    radioContainer: {
        marginRight: 12,
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    radioOuterSelected: {
        borderColor: '#EC1616',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#EC1616',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    iconContainerSelected: {
        backgroundColor: '#FEE2E2',
    },
    textContainer: {
        flex: 1,
    },
    optionLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: '#374151',
    },
    optionLabelSelected: {
        color: '#EC1616',
        fontWeight: '600',
    },
    optionDescription: {
        fontSize: 13,
        color: '#9CA3AF',
        marginTop: 2,
    },
    checkIcon: {
        marginLeft: 8,
    },
});

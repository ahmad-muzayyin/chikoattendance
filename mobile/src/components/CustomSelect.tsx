import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Portal, Modal, Text, Surface, Searchbar, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SelectOption {
    label: string;
    value: string;
    icon?: string;
    description?: string;
}

interface CustomSelectProps {
    label: string;
    value: string;
    options: SelectOption[];
    onSelect: (value: string) => void;
    placeholder?: string;
    searchable?: boolean;
    icon?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
    label,
    value,
    options,
    onSelect,
    placeholder = 'Pilih opsi',
    searchable = false,
    icon
}) => {
    const [visible, setVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = searchable
        ? options.filter(opt =>
            opt.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : options;

    return (
        <>
            <View style={styles.container}>
                {label && <Text style={styles.label}>{label}</Text>}
                <TouchableOpacity
                    style={styles.selector}
                    onPress={() => setVisible(true)}
                    activeOpacity={0.7}
                >
                    <View style={styles.selectorContent}>
                        {icon && (
                            <MaterialCommunityIcons
                                name={icon as any}
                                size={20}
                                color="#6B7280"
                                style={styles.selectorIcon}
                            />
                        )}
                        <Text style={selectedOption ? styles.selectedText : styles.placeholderText}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </Text>
                    </View>
                    <MaterialCommunityIcons
                        name="chevron-down"
                        size={24}
                        color="#9CA3AF"
                    />
                </TouchableOpacity>
            </View>

            <Portal>
                <Modal
                    visible={visible}
                    onDismiss={() => {
                        setVisible(false);
                        setSearchQuery('');
                    }}
                    contentContainerStyle={styles.modal}
                >
                    <Surface style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{label || 'Pilih Opsi'}</Text>
                            <TouchableOpacity
                                onPress={() => setVisible(false)}
                                style={styles.closeButton}
                            >
                                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {searchable && (
                            <Searchbar
                                placeholder="Cari..."
                                onChangeText={setSearchQuery}
                                value={searchQuery}
                                style={styles.searchBar}
                                inputStyle={styles.searchInput}
                                iconColor="#9CA3AF"
                            />
                        )}

                        <ScrollView style={styles.optionsList}>
                            {filteredOptions.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.optionItem,
                                        value === option.value && styles.selectedOption
                                    ]}
                                    onPress={() => {
                                        onSelect(option.value);
                                        setVisible(false);
                                        setSearchQuery('');
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.optionContent}>
                                        {option.icon && (
                                            <View style={[
                                                styles.optionIconContainer,
                                                value === option.value && styles.selectedIconContainer
                                            ]}>
                                                <MaterialCommunityIcons
                                                    name={option.icon as any}
                                                    size={22}
                                                    color={value === option.value ? '#EC1616' : '#6B7280'}
                                                />
                                            </View>
                                        )}
                                        <View style={styles.optionTextContainer}>
                                            <Text style={[
                                                styles.optionLabel,
                                                value === option.value && styles.selectedLabel
                                            ]}>
                                                {option.label}
                                            </Text>
                                            {option.description && (
                                                <Text style={styles.optionDescription}>
                                                    {option.description}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                    {value === option.value && (
                                        <MaterialCommunityIcons
                                            name="check-circle"
                                            size={24}
                                            color="#EC1616"
                                        />
                                    )}
                                </TouchableOpacity>
                            ))}
                            {filteredOptions.length === 0 && (
                                <View style={styles.emptyState}>
                                    <MaterialCommunityIcons
                                        name="magnify"
                                        size={48}
                                        color="#D1D5DB"
                                    />
                                    <Text style={styles.emptyText}>Tidak ada hasil</Text>
                                </View>
                            )}
                        </ScrollView>
                    </Surface>
                </Modal>
            </Portal>
        </>
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
        marginBottom: 8,
    },
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    selectorContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    selectorIcon: {
        marginRight: 12,
    },
    selectedText: {
        fontSize: 15,
        color: '#1F2937',
        fontWeight: '500',
    },
    placeholderText: {
        fontSize: 15,
        color: '#9CA3AF',
    },
    modal: {
        padding: 20,
        justifyContent: 'center',
    },
    modalContent: {
        borderRadius: 24,
        maxHeight: '80%',
        backgroundColor: '#FFFFFF',
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    closeButton: {
        padding: 4,
    },
    searchBar: {
        marginHorizontal: 20,
        marginTop: 16,
        marginBottom: 8,
        elevation: 0,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
    },
    searchInput: {
        fontSize: 15,
    },
    optionsList: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 4,
    },
    selectedOption: {
        backgroundColor: '#FEF2F2',
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    optionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    selectedIconContainer: {
        backgroundColor: '#FEE2E2',
    },
    optionTextContainer: {
        flex: 1,
    },
    optionLabel: {
        fontSize: 15,
        color: '#374151',
        fontWeight: '500',
    },
    selectedLabel: {
        color: '#EC1616',
        fontWeight: '600',
    },
    optionDescription: {
        fontSize: 13,
        color: '#9CA3AF',
        marginTop: 2,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 15,
        color: '#9CA3AF',
        marginTop: 12,
    },
});

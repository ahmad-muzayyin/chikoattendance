# 🎨 UI Components Documentation

## Custom Components yang Telah Ditambahkan

### 1. **CustomAlert** - Modern Alert Dialog

Alert yang stylish dan modern dengan icon indicator dan smooth animations.

#### Features:
- ✨ 4 tipe alert: success, error, warning, info
- 🎨 Icon dengan background color sesuai tipe
- 📱 Responsive dan modern design
- ⚡ Smooth animations
- 🎯 Customizable buttons

#### Usage:

```typescript
import { CustomAlert } from '../components';

// Di component Anda
const [alertVisible, setAlertVisible] = useState(false);

<CustomAlert
    visible={alertVisible}
    onDismiss={() => setAlertVisible(false)}
    title="Berhasil!"
    message="Data berhasil disimpan"
    type="success"
    confirmText="OK"
    onConfirm={() => console.log('Confirmed')}
/>

// Dengan cancel button
<CustomAlert
    visible={alertVisible}
    onDismiss={() => setAlertVisible(false)}
    title="Konfirmasi"
    message="Apakah Anda yakin ingin menghapus?"
    type="warning"
    confirmText="Ya, Hapus"
    cancelText="Batal"
    onConfirm={() => handleDelete()}
    onCancel={() => console.log('Cancelled')}
/>
```

#### Props:

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| visible | boolean | ✅ | - | Show/hide alert |
| onDismiss | () => void | ✅ | - | Callback when dismissed |
| title | string | ✅ | - | Alert title |
| message | string | ✅ | - | Alert message |
| type | 'success' \| 'error' \| 'warning' \| 'info' | ❌ | 'info' | Alert type |
| confirmText | string | ❌ | 'OK' | Confirm button text |
| cancelText | string | ❌ | - | Cancel button text (optional) |
| onConfirm | () => void | ❌ | - | Confirm callback |
| onCancel | () => void | ❌ | - | Cancel callback |

---

### 2. **CustomSelect** - Modern Select/Picker

Select dropdown yang modern dengan search functionality dan icon support.

#### Features:
- 🔍 Searchable options
- 🎨 Icon support untuk setiap option
- 📝 Description support
- ✨ Selected state indicator
- 📱 Modal-based dengan smooth animations
- 🎯 Empty state handling

#### Usage:

```typescript
import { CustomSelect } from '../components';

const [selectedRole, setSelectedRole] = useState('');

const roleOptions = [
    { 
        label: 'Owner', 
        value: 'OWNER',
        icon: 'crown',
        description: 'Full access to all features'
    },
    { 
        label: 'Head', 
        value: 'HEAD',
        icon: 'account-tie',
        description: 'Manage branch employees'
    },
    { 
        label: 'Employee', 
        value: 'EMPLOYEE',
        icon: 'account',
        description: 'Basic attendance features'
    },
];

<CustomSelect
    label="Role"
    value={selectedRole}
    options={roleOptions}
    onSelect={setSelectedRole}
    placeholder="Pilih role"
    searchable={true}
    icon="shield-account"
/>
```

#### Props:

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| label | string | ✅ | - | Label di atas selector |
| value | string | ✅ | - | Selected value |
| options | SelectOption[] | ✅ | - | Array of options |
| onSelect | (value: string) => void | ✅ | - | Callback when option selected |
| placeholder | string | ❌ | 'Pilih opsi' | Placeholder text |
| searchable | boolean | ❌ | false | Enable search |
| icon | string | ❌ | - | Icon name (MaterialCommunityIcons) |

#### SelectOption Interface:

```typescript
interface SelectOption {
    label: string;        // Display text
    value: string;        // Value
    icon?: string;        // MaterialCommunityIcons name
    description?: string; // Optional description
}
```

---

### 3. **CustomRadioButton** - Modern Radio Button

Radio button yang modern dengan support icon, description, dan layout horizontal/vertical.

#### Features:
- 🎨 Modern & minimalist design
- 📱 Horizontal & vertical layouts
- 🎯 Icon support
- 📝 Description support
- ✅ Visual feedback dengan checkmark
- ⚡ Smooth animations

#### Usage:

```typescript
import { CustomRadioButton } from '../components';

const [selectedRole, setSelectedRole] = useState('EMPLOYEE');

const roleOptions = [
    { 
        label: 'Owner', 
        value: 'OWNER',
        icon: 'crown',
        description: 'Full access to all features'
    },
    { 
        label: 'Head', 
        value: 'HEAD',
        icon: 'account-tie',
        description: 'Manage branch employees'
    },
    { 
        label: 'Employee', 
        value: 'EMPLOYEE',
        icon: 'account',
        description: 'Basic attendance features'
    },
];

<CustomRadioButton
    label="Pilih Role"
    options={roleOptions}
    value={selectedRole}
    onSelect={setSelectedRole}
/>

// Horizontal layout
<CustomRadioButton
    label="Jenis Kelamin"
    options={genderOptions}
    value={gender}
    onSelect={setGender}
    direction="horizontal"
/>
```

#### Props:

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| label | string | ❌ | - | Label di atas radio group |
| options | RadioOption[] | ✅ | - | Array of radio options |
| value | string | ✅ | - | Selected value |
| onSelect | (value: string) => void | ✅ | - | Callback when option selected |
| direction | 'vertical' \| 'horizontal' | ❌ | 'vertical' | Layout direction |

#### RadioOption Interface:

```typescript
interface RadioOption {
    label: string;        // Display text
    value: string;        // Value
    description?: string; // Optional description
    icon?: string;        // MaterialCommunityIcons name
}
```

---

## 🎨 Design System

### Colors:
- **Success**: `#10B981` (Green)
- **Error**: `#EF4444` (Red)
- **Warning**: `#F59E0B` (Amber)
- **Info**: `#3B82F6` (Blue)
- **Primary**: `#EC1616` (Maroon Red)

### Border Radius:
- Small: `12px`
- Medium: `16px`
- Large: `20px`
- Extra Large: `24px`

### Shadows:
- Small: `elevation: 2`
- Medium: `elevation: 4`
- Large: `elevation: 6`

---

## 📱 Splash Screen

Background splash screen telah diubah menjadi **putih** untuk tampilan yang lebih bersih dan profesional.

**File**: `app.json`
```json
"splash": {
  "backgroundColor": "#FFFFFF"
}
```

---

## 🏢 Header dengan Logo

Header beranda sekarang memiliki layout 3 kolom:
1. **Kiri**: Greeting + Nama + Role Badge
2. **Tengah**: Logo Chiko
3. **Kanan**: Avatar/Profile Picture

### Layout Structure:
```
┌─────────────────────────────────────┐
│  Greeting        Logo       Avatar  │
│  Name            Chiko        [PP]  │
│  [Role]                              │
└─────────────────────────────────────┘
```

---

## 💡 Best Practices

### 1. **Gunakan CustomAlert untuk semua alert**
```typescript
// ❌ Jangan gunakan Alert bawaan
Alert.alert('Error', 'Something went wrong');

// ✅ Gunakan CustomAlert
<CustomAlert
    visible={true}
    title="Error"
    message="Something went wrong"
    type="error"
/>
```

### 2. **Gunakan CustomSelect untuk dropdown**
```typescript
// ❌ Jangan gunakan Picker bawaan
<Picker selectedValue={value} onValueChange={setValue}>
    <Picker.Item label="Option 1" value="1" />
</Picker>

// ✅ Gunakan CustomSelect
<CustomSelect
    value={value}
    options={options}
    onSelect={setValue}
/>
```

### 3. **Gunakan CustomRadioButton untuk radio selection**
```typescript
// ❌ Jangan gunakan RadioButton bawaan
<RadioButton.Group onValueChange={setValue} value={value}>
    <RadioButton.Item label="Option 1" value="1" />
</RadioButton.Group>

// ✅ Gunakan CustomRadioButton
<CustomRadioButton
    options={options}
    value={value}
    onSelect={setValue}
/>
```

### 4. **Konsisten dengan Design System**
- Gunakan warna yang sudah didefinisikan
- Gunakan border radius yang konsisten
- Gunakan spacing yang konsisten

---

## 🚀 Cara Menggunakan di Screen Lain

### Example: Login Screen

```typescript
import React, { useState } from 'react';
import { CustomAlert } from '../components';

export default function LoginScreen() {
    const [showAlert, setShowAlert] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        type: 'info',
        title: '',
        message: ''
    });

    const handleLogin = async () => {
        try {
            // Login logic
            setAlertConfig({
                type: 'success',
                title: 'Berhasil!',
                message: 'Login berhasil'
            });
            setShowAlert(true);
        } catch (error) {
            setAlertConfig({
                type: 'error',
                title: 'Gagal!',
                message: 'Email atau password salah'
            });
            setShowAlert(true);
        }
    };

    return (
        <View>
            {/* Your login form */}
            
            <CustomAlert
                visible={showAlert}
                onDismiss={() => setShowAlert(false)}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type as any}
            />
        </View>
    );
}
```

---

## 📝 Notes

- Semua komponen menggunakan **Material Design 3** principles
- Komponen sudah **responsive** dan **accessible**
- Animasi menggunakan **React Native Paper** transitions
- Icons menggunakan **MaterialCommunityIcons** dari `@expo/vector-icons`

---

**Last Updated**: 29 Desember 2025  
**Version**: 2.0.0

# 📻 Custom RadioButton Component

## Modern, Professional, & Minimalist Radio Button

Component radio button yang stylish dengan support untuk icon, description, dan layout horizontal/vertical.

---

## ✨ Features

- 🎨 **Modern Design** - Clean, minimalist, professional
- 📱 **Responsive** - Horizontal & vertical layouts
- 🎯 **Icon Support** - Optional icons untuk setiap option
- 📝 **Description** - Tambahkan deskripsi untuk setiap option
- ✅ **Visual Feedback** - Selected state dengan warna & checkmark
- ⚡ **Smooth Animations** - Transisi yang halus

---

## 📖 Usage

### Basic Usage

```typescript
import { CustomRadioButton } from '../components';

const [selectedRole, setSelectedRole] = useState('EMPLOYEE');

const roleOptions = [
    { label: 'Owner', value: 'OWNER' },
    { label: 'Head', value: 'HEAD' },
    { label: 'Employee', value: 'EMPLOYEE' },
];

<CustomRadioButton
    label="Pilih Role"
    options={roleOptions}
    value={selectedRole}
    onSelect={setSelectedRole}
/>
```

### With Icons & Descriptions

```typescript
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
```

### Horizontal Layout

```typescript
const genderOptions = [
    { label: 'Laki-laki', value: 'male', icon: 'gender-male' },
    { label: 'Perempuan', value: 'female', icon: 'gender-female' },
];

<CustomRadioButton
    label="Jenis Kelamin"
    options={genderOptions}
    value={gender}
    onSelect={setGender}
    direction="horizontal"
/>
```

---

## 🎨 Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| label | string | ❌ | - | Label di atas radio group |
| options | RadioOption[] | ✅ | - | Array of radio options |
| value | string | ✅ | - | Selected value |
| onSelect | (value: string) => void | ✅ | - | Callback when option selected |
| direction | 'vertical' \| 'horizontal' | ❌ | 'vertical' | Layout direction |

### RadioOption Interface

```typescript
interface RadioOption {
    label: string;        // Display text
    value: string;        // Value
    description?: string; // Optional description
    icon?: string;        // MaterialCommunityIcons name
}
```

---

## 🔄 Migration from React Native Paper

### Before (React Native Paper):

```typescript
import { RadioButton } from 'react-native-paper';

<RadioButton.Group onValueChange={setValue} value={value}>
    <RadioButton.Item label="Option 1" value="1" />
    <RadioButton.Item label="Option 2" value="2" />
    <RadioButton.Item label="Option 3" value="3" />
</RadioButton.Group>
```

### After (Custom Component):

```typescript
import { CustomRadioButton } from '../components';

const options = [
    { label: 'Option 1', value: '1' },
    { label: 'Option 2', value: '2' },
    { label: 'Option 3', value: '3' },
];

<CustomRadioButton
    options={options}
    value={value}
    onSelect={setValue}
/>
```

---

## 💡 Real-World Examples

### 1. Role Selection (UserFormScreen)

```typescript
const roleOptions = [
    { 
        label: 'Owner', 
        value: 'OWNER',
        icon: 'crown',
        description: 'Akses penuh ke semua fitur'
    },
    { 
        label: 'Kepala Toko', 
        value: 'HEAD',
        icon: 'account-tie',
        description: 'Kelola karyawan cabang'
    },
    { 
        label: 'Karyawan', 
        value: 'EMPLOYEE',
        icon: 'account',
        description: 'Fitur absensi dasar'
    },
];

<CustomRadioButton
    label="Role Pengguna"
    options={roleOptions}
    value={role}
    onSelect={setRole}
/>
```

### 2. Branch Selection

```typescript
const branchOptions = [
    { label: 'Toko Pusat / Semua', value: '' },
    ...branches.map(b => ({
        label: b.name,
        value: b.id.toString(),
        description: b.address
    }))
];

<CustomRadioButton
    label="Pilih Outlet"
    options={branchOptions}
    value={branchId}
    onSelect={setBranchId}
/>
```

### 3. Position Selection

```typescript
const positionOptions = COMMON_POSITIONS.map(pos => ({
    label: pos,
    value: pos,
    icon: 'briefcase'
}));

<CustomRadioButton
    label="Posisi"
    options={positionOptions}
    value={position}
    onSelect={setPosition}
/>
```

### 4. Status Selection (Horizontal)

```typescript
const statusOptions = [
    { label: 'Hadir', value: 'PRESENT', icon: 'check-circle' },
    { label: 'Izin', value: 'PERMIT', icon: 'file-document' },
    { label: 'Sakit', value: 'SICK', icon: 'hospital' },
    { label: 'Alpha', value: 'ABSENT', icon: 'close-circle' },
];

<CustomRadioButton
    label="Status Kehadiran"
    options={statusOptions}
    value={status}
    onSelect={setStatus}
    direction="horizontal"
/>
```

---

## 🎨 Visual Design

### Vertical Layout:
```
┌─────────────────────────────┐
│  Pilih Role                 │
│                             │
│  ┌───────────────────────┐  │
│  │ ⚪ 👑 Owner         ✓ │  │
│  │   Full access         │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ ⚪ 👔 Head            │  │
│  │   Manage employees    │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ ⚪ 👤 Employee        │  │
│  │   Basic features      │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

### Horizontal Layout:
```
┌─────────────────────────────┐
│  Jenis Kelamin              │
│                             │
│  ┌──────────┐  ┌──────────┐ │
│  │ ⚪ ♂️    │  │ ⚪ ♀️    │ │
│  │ Laki-laki│  │ Perempuan│ │
│  └──────────┘  └──────────┘ │
└─────────────────────────────┘
```

---

## 🎯 Design Tokens

### Colors:
- **Selected Background**: `#FEF2F2` (Light Red)
- **Selected Border**: `#EC1616` (Primary Red)
- **Unselected Background**: `#F9FAFB` (Light Gray)
- **Unselected Border**: `#E5E7EB` (Gray)
- **Radio Dot**: `#EC1616` (Primary Red)

### Spacing:
- **Option Padding**: `14px vertical, 16px horizontal`
- **Gap between options**: `8px`
- **Border Radius**: `12px`
- **Radio Size**: `22px outer, 12px inner`

### Typography:
- **Label**: 14px, Semi-bold (600)
- **Option Label**: 15px, Medium (500)
- **Description**: 13px, Regular (400)

---

## ✅ Best Practices

### 1. **Use Descriptive Labels**
```typescript
// ❌ Bad
{ label: 'Option 1', value: '1' }

// ✅ Good
{ label: 'Owner', value: 'OWNER', description: 'Full access' }
```

### 2. **Add Icons for Better UX**
```typescript
// ✅ Icons help users identify options quickly
const options = [
    { label: 'Hadir', value: 'PRESENT', icon: 'check-circle' },
    { label: 'Izin', value: 'PERMIT', icon: 'file-document' },
];
```

### 3. **Use Horizontal for Few Options**
```typescript
// ✅ Good for 2-3 options
<CustomRadioButton
    options={genderOptions}
    direction="horizontal"
/>

// ❌ Bad for many options (use vertical)
<CustomRadioButton
    options={manyOptions} // 5+ options
    direction="horizontal" // Will wrap and look messy
/>
```

### 4. **Provide Descriptions When Needed**
```typescript
// ✅ Helpful for complex choices
const roleOptions = [
    { 
        label: 'Owner', 
        value: 'OWNER',
        description: 'Akses penuh, kelola semua cabang'
    },
];
```

---

## 📝 Notes

- Component menggunakan **Material Design 3** principles
- Fully **accessible** dengan proper touch targets (min 44x44)
- **Smooth animations** untuk selected state
- **Consistent** dengan design system aplikasi
- Support **dark mode** (coming soon)

---

**Created**: 29 Desember 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready

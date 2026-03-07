import React from 'react';
import {
    Box, Paper, Typography, Button, TextField,
    Select, FormControl, InputLabel, Alert, CircularProgress, MenuItem,
} from '@mui/material';
import { Add, PersonAdd, Business } from '@mui/icons-material';
import { ROLES_META } from '../../constants/roles';
import RouteBranchSelector from '../RouteBranchSelector';

const UserForm = ({ form, setForm, onSubmit, creating, formError }) => {
    const isEmployee = form.role === 'EMPLOYEE';

    const field = (label, key, props = {}) => (
        <TextField size="small" label={label} value={form[key]}
            onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && onSubmit()}
            {...props} />
    );

    return (
        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonAdd fontSize="small" color="primary" />
                Додати користувача
            </Typography>
            {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{formError}</Alert>}

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                {field('Email *', 'email', { sx: { flex: '1 1 220px' }, type: 'email' })}
                {field('Прізвище', 'lastName', { sx: { flex: '1 1 160px' } })}
                {field("Ім'я", 'firstName', { sx: { flex: '1 1 160px' } })}
                {field('По батькові', 'middleName', { sx: { flex: '1 1 160px' } })}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start', mb: 2 }}>
                {field('Телефон', 'phoneNumber', { sx: { flex: '1 1 180px' }, placeholder: '+380XXXXXXXXX' })}
                <FormControl size="small" sx={{ flex: '1 1 160px' }}>
                    <InputLabel>Роль</InputLabel>
                    <Select value={form.role} label="Роль"
                        onChange={e => setForm(p => ({ ...p, role: e.target.value, branchId: '', cityId: '' }))}>
                        {ROLES_META.map(r => (
                            <MenuItem key={r.value} value={r.value}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: r.color }} />
                                    {r.label}
                                </Box>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {isEmployee && (
                <Box sx={{ mb: 2 }}>
                    <RouteBranchSelector
                        title="Відділення працівника"
                        icon={Business}
                        color="#673ab7"
                        cityId={form.cityId || ''}
                        branchId={form.branchId || ''}
                        onCityChange={(cityId) => setForm(p => ({ ...p, cityId, branchId: '' }))}
                        onBranchChange={(branchId) => setForm(p => ({ ...p, branchId }))}
                        error={!form.branchId}
                        errorText="Оберіть відділення для працівника"
                    />
                </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained"
                    startIcon={creating ? <CircularProgress size={16} color="inherit" /> : <Add />}
                    onClick={onSubmit} disabled={creating}
                    sx={{ bgcolor: '#673ab7', borderRadius: 2, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#512da8' }, height: 40 }}>
                    Створити
                </Button>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                * Обов'язкові поля. Після створення користувач отримає email з посиланням для встановлення пароля.
            </Typography>
        </Paper>
    );
};

export default UserForm;
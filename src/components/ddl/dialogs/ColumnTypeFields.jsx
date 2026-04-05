import {
    MenuItem, TextField, Box, FormControlLabel, Switch,
} from '@mui/material';
import { COLUMN_DATA_TYPES, TYPES_WITH_LENGTH, TYPES_WITH_PRECISION } from '../../../constants/ddl';

export default function ColumnTypeFields({ form, onChange }) {
    const needsLength = TYPES_WITH_LENGTH.includes(form.dataType);
    const needsPrecision = TYPES_WITH_PRECISION.includes(form.dataType);

    return (
        <>
            <TextField
                select
                label="Тип даних"
                value={form.dataType}
                onChange={e => onChange({ ...form, dataType: e.target.value, length: null, precision: null, scale: null })}
                fullWidth size="small"
            >
                {COLUMN_DATA_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>

            {needsLength && (
                <TextField
                    label="Довжина"
                    type="number"
                    value={form.length ?? ''}
                    onChange={e => onChange({ ...form, length: Number(e.target.value) || null })}
                    fullWidth size="small"
                    inputProps={{ min: 1, max: 8000 }}
                />
            )}

            {needsPrecision && (
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <TextField
                        label="Точність"
                        type="number"
                        value={form.precision ?? ''}
                        onChange={e => onChange({ ...form, precision: Number(e.target.value) || null })}
                        fullWidth size="small"
                        inputProps={{ min: 1, max: 38 }}
                    />
                    <TextField
                        label="Масштаб"
                        type="number"
                        value={form.scale ?? ''}
                        onChange={e => onChange({ ...form, scale: Number(e.target.value) || null })}
                        fullWidth size="small"
                        inputProps={{ min: 0, max: 38 }}
                    />
                </Box>
            )}

            <FormControlLabel
                control={
                    <Switch
                        checked={form.nullable}
                        onChange={e => onChange({ ...form, nullable: e.target.checked })}
                        size="small"
                    />
                }
                label="Nullable"
            />
        </>
    );
}
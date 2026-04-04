import React from 'react';
import {
    Box, Typography, TextField, Autocomplete, Grid, Card, CardContent,
    Divider, FormControlLabel, Checkbox, RadioGroup, Radio,
    InputAdornment, Chip, Collapse, alpha,
} from '@mui/material';
import { Calculate, CreditCard, AccountBalanceWallet } from '@mui/icons-material';
import { motion } from 'framer-motion';

const PriceStep = ({
    formData, setFormData, fieldErrors, setFieldErrors,
    mainColor, direction, variants, paymentTypes,
}) => {
    const selectedPaymentType = paymentTypes.find(p => p.id === formData.paymentTypeId) ?? null;
    const p = formData.price;

    const priceRows = [
        { label: 'Базовий тариф', value: p.deliveryPrice, hint: 'Стандарт — 60 ₴, Експрес — 85 ₴' },
        { label: 'За вагу', value: p.weightPrice, hint: `${formData.parcel.actualWeight} кг × 3.5 ₴` },
        { label: 'За відстань', value: p.distancePrice, hint: 'Відстань × 0.8 ₴/км (макс. 500 ₴)' },
        { label: 'Коробка', value: p.boxVariantPrice, hint: 'Вартість обраної коробки' },
        { label: 'Спец. пакування', value: p.specialPackagingPrice, hint: 'Надбавка за умови зберігання — 45 ₴' },
        { label: 'Страховий збір', value: p.insuranceFee, hint: `${formData.parcel.declaredValue} × 0.5% (мін. 5 ₴)` },
    ];

    return (
        <motion.div key="s2" custom={direction} variants={variants} initial="enter" animate="center" exit="exit">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography variant="subtitle2" sx={{
                    color: '#666', fontWeight: 800,
                    display: 'flex', alignItems: 'center', gap: 1, textTransform: 'uppercase',
                }}>
                    <Calculate sx={{ color: mainColor, fontSize: 18 }} /> Розрахунок вартості
                </Typography>

                <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: '#fafafa' }}>
                    <CardContent>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Доставка:</Typography>
                                <Typography fontWeight="700">{p.deliveryPrice.toFixed(2)} ₴</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">За вагу:</Typography>
                                <Typography fontWeight="700">{p.weightPrice.toFixed(2)} ₴</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Коробка:</Typography>
                                <Typography fontWeight="700">{p.boxVariantPrice.toFixed(2)} ₴</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Страховка:</Typography>
                                <Typography fontWeight="700">{p.insuranceFee.toFixed(2)} ₴</Typography>
                            </Grid>
                        </Grid>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" fontWeight="700">РАЗОМ:</Typography>
                            <Typography variant="h5" sx={{ color: mainColor, fontWeight: 900 }}>
                                {p.totalPrice.toFixed(2)} ₴
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>

                <Box sx={{
                    p: 1.5, borderRadius: 2,
                    bgcolor: alpha('#607d8b', 0.05),
                    border: `1px solid ${alpha('#607d8b', 0.15)}`,
                }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}
                        sx={{ textTransform: 'uppercase', display: 'block', mb: 1 }}>
                        Як розраховується вартість
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {priceRows.map(({ label, value, hint }) => (
                            <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="caption" fontWeight={600} color="text.primary">{label}</Typography>
                                    <Typography variant="caption" color="text.disabled" sx={{ ml: 1 }}>{hint}</Typography>
                                </Box>
                                <Typography variant="caption" fontWeight={700}>{value.toFixed(2)} ₴</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>

                <RadioGroup
                    row
                    value={formData.senderPay ? 'sender' : 'recipient'}
                    onChange={e => {
                        const isSender = e.target.value === 'sender';
                        setFormData(prev => ({
                            ...prev,
                            senderPay: isSender,
                            fullyPaid: isSender,
                            partiallyPaid: false,
                            partialAmount: '',
                            paymentTypeId: isSender ? prev.paymentTypeId : null,
                        }));
                    }}
                >
                    <FormControlLabel value="sender" control={<Radio sx={{ color: mainColor }} />} label="Оплачує відправник" />
                    <FormControlLabel value="recipient" control={<Radio sx={{ color: mainColor }} />} label="Оплачує отримувач" />
                </RadioGroup>

                <Collapse in={formData.senderPay}>
                    <Box sx={{
                        p: 2, borderRadius: 2,
                        border: `1px solid ${alpha(mainColor, 0.2)}`,
                        bgcolor: alpha(mainColor, 0.02),
                        display: 'flex', flexDirection: 'column', gap: 2
                    }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                            Деталі оплати
                        </Typography>

                        <FormControlLabel
                            control={
                                <Checkbox
                                    sx={{ color: '#4caf50', '&.Mui-checked': { color: '#4caf50' } }}
                                    checked={formData.fullyPaid}
                                    onChange={e => setFormData(prev => ({
                                        ...prev,
                                        fullyPaid: e.target.checked,
                                        partiallyPaid: !e.target.checked,
                                        partialAmount: e.target.checked ? '' : prev.partialAmount,
                                    }))}
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" fontWeight={600}>Повна оплата</Typography>
                                    {formData.fullyPaid && (
                                        <Chip label={`${p.totalPrice.toFixed(2)} ₴`} size="small" sx={{
                                            height: 20, fontSize: 10, fontWeight: 700,
                                            bgcolor: alpha('#4caf50', 0.1), color: '#2e7d32',
                                        }} />
                                    )}
                                </Box>
                            }
                        />

                        <Collapse in={!formData.fullyPaid}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <TextField
                                    fullWidth size="small" type="number"
                                    label="Сума першого платежу (аванс)"
                                    value={formData.partialAmount}
                                    onChange={e => setFormData(prev => ({
                                        ...prev,
                                        partialAmount: e.target.value,
                                        partiallyPaid: true
                                    }))}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">₴</InputAdornment>,
                                    }}
                                />
                                {formData.partialAmount && (
                                    <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
                                        Залишок: {(p.totalPrice - parseFloat(formData.partialAmount || 0)).toFixed(2)} ₴
                                    </Typography>
                                )}
                            </Box>
                        </Collapse>

                        <Autocomplete
                            options={paymentTypes}
                            value={selectedPaymentType}
                            getOptionLabel={o => o.name || ''}
                            onChange={(_, v) => {
                                setFormData(prev => ({ ...prev, paymentTypeId: v?.id ?? null }));
                                setFieldErrors(prev => ({ ...prev, paymentTypeId: null }));
                            }}
                            renderInput={p => (
                                <TextField {...p} label="Спосіб розрахунку" size="small"
                                    error={!!fieldErrors.paymentTypeId}
                                    helperText={fieldErrors.paymentTypeId}
                                    InputProps={{
                                        ...p.InputProps,
                                        startAdornment: <CreditCard sx={{ mr: 1, color: 'text.disabled', fontSize: 20 }} />,
                                    }}
                                />
                            )}
                        />
                    </Box>
                </Collapse>

                <Collapse in={!formData.senderPay}>
                    <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, border: '1px dashed #ccc', textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Оплата буде здійснена отримувачем у повному обсязі ({p.totalPrice.toFixed(2)} ₴)
                        </Typography>
                    </Box>
                </Collapse>
            </Box>
        </motion.div>
    );
};

export default PriceStep;
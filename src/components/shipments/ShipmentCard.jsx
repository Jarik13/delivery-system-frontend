import React from 'react';
import {
    Card, CardContent, Box, Chip, IconButton, Typography,
    Divider, Collapse, Button, useTheme, alpha
} from '@mui/material';
import {
    Delete, TripOrigin, LocationOn, RemoveCircleOutline, AddCircleOutline,
    AccessTime, EventAvailable, ErrorOutline, CheckCircle, PendingActions,
    ExpandLess, ExpandMore, Inventory2, LocalShipping,
} from '@mui/icons-material';

const ShipmentCard = ({
    s,
    mainColor,
    statusColors,
    isHistoryExpanded,
    isFinanceExpanded,
    history,
    onDelete,
    onToggleHistory,
    onToggleFinance,
}) => {
    const theme = useTheme();
    const statusColor = statusColors[s.shipmentStatusName] || statusColors.default;

    return (
        <Card sx={{
            width: '100%', height: '100%', borderRadius: 4,
            transition: 'all 0.3s ease', border: '1px solid', borderColor: 'divider',
            display: 'flex', flexDirection: 'column',
            '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: `0 12px 24px ${alpha(mainColor, 0.15)}`,
                borderColor: mainColor,
            },
        }} elevation={0}>
            <CardContent sx={{
                p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column',
                '&:last-child': { pb: 2.5 },
            }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Chip label={s.trackingNumber} size="small"
                        sx={{ fontWeight: 700, bgcolor: alpha(mainColor, 0.1), color: mainColor }} />
                    <IconButton size="small" color="error" onClick={() => onDelete(s.id)}>
                        <Delete fontSize="small" />
                    </IconButton>
                </Box>

                <Typography variant="h6" fontWeight="700" sx={{ mb: 0.5, lineHeight: 1.2 }}>
                    {s.parcelDescription || 'Без опису'}
                </Typography>

                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1 }}>
                    {s.shipmentTypeName && (
                        <Chip
                            icon={<LocalShipping sx={{ fontSize: '13px !important' }} />}
                            label={s.shipmentTypeName}
                            size="small"
                            sx={{
                                height: 20, fontSize: '0.65rem', fontWeight: 700,
                                bgcolor: alpha(mainColor, 0.07), color: mainColor,
                                border: `1px solid ${alpha(mainColor, 0.2)}`,
                            }}
                        />
                    )}
                    {s.boxVariantName && (
                        <Chip
                            icon={<Inventory2 sx={{ fontSize: '13px !important' }} />}
                            label={s.boxVariantName}
                            size="small"
                            sx={{
                                height: 20, fontSize: '0.65rem', fontWeight: 700,
                                bgcolor: alpha(theme.palette.info.main, 0.07),
                                color: theme.palette.info.main,
                                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                            }}
                        />
                    )}
                    {s.hasSpecialPackaging && (
                        <Chip
                            label="Спец. пакування"
                            size="small"
                            sx={{
                                height: 20, fontSize: '0.65rem', fontWeight: 700,
                                bgcolor: alpha(theme.palette.warning.main, 0.08),
                                color: theme.palette.warning.main,
                                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                            }}
                        />
                    )}
                </Box>

                <Divider sx={{ mt: 0.5, mb: 1.5, opacity: 0.5, borderStyle: 'dashed' }} />

                <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1.8, mb: 2, minHeight: '110px', alignItems: 'stretch' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 0.5 }}>
                            <TripOrigin sx={{ fontSize: 10, color: theme.palette.primary.main }} />
                            <Box sx={{
                                width: '1px', flexGrow: 1, my: 0.5, borderLeft: '1px dashed #ccc',
                                position: 'relative', minHeight: isHistoryExpanded ? '40px' : '20px',
                            }}>
                                <IconButton size="small" onClick={() => onToggleHistory(s.id)} sx={{
                                    position: 'absolute', top: '50%', left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    bgcolor: 'white', border: '1px solid #eee', p: '2px', zIndex: 2,
                                }}>
                                    {isHistoryExpanded
                                        ? <RemoveCircleOutline sx={{ fontSize: 14, color: mainColor }} />
                                        : <AddCircleOutline sx={{ fontSize: 14, color: mainColor }} />}
                                </IconButton>
                            </Box>
                            <LocationOn sx={{ fontSize: 14, color: theme.palette.secondary.main }} />
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <Box>
                                <Typography variant="body2" fontWeight="700" sx={{ lineHeight: 1.1 }}>
                                    {s.originCityName ? `${s.originCityName}, ` : ''}{s.originLocationName || 'Не вказано'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap display="block">
                                    {s.senderFullName}
                                </Typography>
                            </Box>

                            <Collapse in={isHistoryExpanded}>
                                <Box sx={{
                                    my: 1.5, pl: 1.5,
                                    borderLeft: `2px solid ${alpha(mainColor, 0.1)}`,
                                    display: 'flex', flexDirection: 'column', gap: 1.5,
                                }}>
                                    {history.length > 0 ? (
                                        history
                                            .filter(step =>
                                                step.locationName !== s.originLocationName &&
                                                step.locationName !== s.destinationLocationName)
                                            .map((step, idx) => (
                                                <Box key={idx} sx={{ position: 'relative', mb: 1.5 }}>
                                                    <Box sx={{
                                                        position: 'absolute', left: -17, top: 6,
                                                        width: 6, height: 6, borderRadius: '50%',
                                                        bgcolor: alpha(mainColor, 0.4),
                                                    }} />
                                                    <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', lineHeight: 1.1 }}>
                                                        {step.cityName ? `${step.cityName}, ` : ''}{step.locationName}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                                        {step.statusDescription} •{' '}
                                                        {new Date(step.time).toLocaleString([], {
                                                            day: '2-digit', month: '2-digit', year: 'numeric',
                                                            hour: '2-digit', minute: '2-digit',
                                                        })}
                                                    </Typography>
                                                </Box>
                                            ))
                                    ) : (
                                        <Typography variant="caption" color="text.disabled"
                                            sx={{ fontStyle: 'italic', fontSize: '0.7rem' }}>
                                            Транзитних пунктів не зафіксовано
                                        </Typography>
                                    )}
                                </Box>
                            </Collapse>

                            <Box sx={{ mt: isHistoryExpanded ? 0.5 : 'auto' }}>
                                <Typography variant="body2" fontWeight="700" sx={{ lineHeight: 1.1 }}>
                                    {s.destinationCityName ? `${s.destinationCityName}, ` : ''}{s.destinationLocationName || 'Не вказано'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap display="block">
                                    {s.recipientFullName}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: 'text.secondary' }}>
                                <AccessTime sx={{ fontSize: 14 }} />
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>Оформлено:</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                {new Date(s.createdAt).toLocaleString([], {
                                    day: '2-digit', month: '2-digit', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit',
                                })}
                            </Typography>
                        </Box>
                        {s.issuedAt && (
                            <Box sx={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                bgcolor: alpha(theme.palette.success.main, 0.05),
                                p: 0.5, px: 1, borderRadius: 1.5,
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: 'success.main' }}>
                                    <EventAvailable sx={{ fontSize: 14 }} />
                                    <Typography variant="caption" sx={{ fontWeight: 800 }}>Видано:</Typography>
                                </Box>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'success.main' }}>
                                    {new Date(s.issuedAt).toLocaleString([], {
                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit',
                                    })}
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {(s.boxVariantDimensions || s.boxVariantPrice > 0 || s.specialPackagingPrice > 0) && (
                        <Box sx={{
                            mb: 1.5, p: 1, borderRadius: 2,
                            bgcolor: alpha(theme.palette.info.main, 0.04),
                            border: `1px solid ${alpha(theme.palette.info.main, 0.12)}`,
                            display: 'flex', flexDirection: 'column', gap: 0.4,
                        }}>
                            <Typography variant="caption" fontWeight="800" color="info.main"
                                sx={{ textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: 0.5 }}>
                                Пакування
                            </Typography>
                            {s.boxVariantDimensions && (
                                <Typography variant="caption" color="text.secondary">
                                    Коробка: <b>{s.boxVariantDimensions}</b>
                                    {s.boxVariantPrice > 0 && ` · ${s.boxVariantPrice} ₴`}
                                </Typography>
                            )}
                            {s.specialPackagingPrice > 0 && (
                                <Typography variant="caption" color="text.secondary">
                                    Спец. пакування: <b>{s.specialPackagingPrice} ₴</b>
                                </Typography>
                            )}
                        </Box>
                    )}

                    <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px dashed #ddd' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            {(() => {
                                let st = { label: 'Не оплачено', color: '#d32f2f', icon: <ErrorOutline sx={{ fontSize: 14 }} /> };
                                if (s.isFullyPaid) st = { label: 'Оплачено', color: '#2e7d32', icon: <CheckCircle sx={{ fontSize: 14 }} /> };
                                else if (s.totalPaidAmount > 0) st = { label: 'Частково', color: '#ffa000', icon: <PendingActions sx={{ fontSize: 14 }} /> };
                                return (
                                    <Chip icon={st.icon} label={st.label} size="small" sx={{
                                        height: 20, fontSize: '0.65rem', fontWeight: 800,
                                        bgcolor: alpha(st.color, 0.1), color: st.color,
                                        border: `1px solid ${alpha(st.color, 0.2)}`,
                                    }} />
                                );
                            })()}
                            <Button size="small" onClick={() => onToggleFinance(s.id)}
                                endIcon={isFinanceExpanded ? <ExpandLess /> : <ExpandMore />}
                                sx={{ fontSize: '0.65rem', fontWeight: 700, p: 0, minWidth: 'auto', textTransform: 'none', color: mainColor }}>
                                {(s.payments?.length || 0) + (s.returns?.length || 0) > 0 ? 'Транзакції' : 'Платежі'}
                            </Button>
                        </Box>
                        <Collapse in={isFinanceExpanded}>
                            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                                {s.payments?.map(p => (
                                    <Box key={p.id} sx={{
                                        p: 0.8, borderRadius: 1,
                                        bgcolor: alpha(theme.palette.success.main, 0.03),
                                        borderLeft: `2px solid ${theme.palette.success.main}`,
                                        display: 'flex', justifyContent: 'space-between',
                                    }}>
                                        <Box>
                                            <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', lineHeight: 1 }}>
                                                {p.amount} ₴
                                            </Typography>
                                            <Typography variant="caption" sx={{ fontSize: '0.55rem', color: 'text.secondary' }}>
                                                {p.paymentTypeName}
                                            </Typography>
                                        </Box>
                                        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.disabled' }}>
                                            {new Date(p.paymentDate).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Collapse>
                    </Box>
                </Box>

                <Box sx={{ mt: 'auto', pt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1 }}>
                        <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
                                Загальна вартість:
                            </Typography>
                            {s.remainingAmount > 0 && (
                                <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 800, fontSize: '0.7rem' }}>
                                    Борг: {s.remainingAmount} ₴
                                </Typography>
                            )}
                        </Box>
                        <Typography variant="h6" fontWeight="900"
                            sx={{ color: s.isFullyPaid ? 'success.main' : 'text.primary', lineHeight: 1 }}>
                            {s.totalPrice} ₴
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip label={s.shipmentStatusName} size="small" variant="outlined" sx={{
                            height: 22, fontSize: '0.65rem', fontWeight: 800,
                            borderColor: statusColor, color: statusColor,
                            bgcolor: alpha(statusColor, 0.08),
                        }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled' }}>
                            {s.actualWeight} кг
                        </Typography>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default ShipmentCard;
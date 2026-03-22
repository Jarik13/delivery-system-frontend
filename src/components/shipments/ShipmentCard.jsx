import React, { useState } from 'react';
import {
    Card, CardContent, Box, Chip, IconButton, Typography,
    Divider, Collapse, Button, useTheme, alpha, Tooltip,
} from '@mui/material';
import {
    Delete, TripOrigin, LocationOn, RemoveCircleOutline, AddCircleOutline,
    AccessTime, EventAvailable, ErrorOutline, CheckCircle, PendingActions,
    ExpandLess, ExpandMore, Inventory2, LocalShipping,
    ArticleOutlined, RouteOutlined, OpenInNew,
    Edit, AssignmentReturn
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getTypeColor, SHIPMENT_TYPE_COLORS } from '../../constants/typeColors';
import ReturnDialog from './ReturnDialog';

const LinkedDocChip = ({ icon, label, number, color, onClick }) => {
    const theme = useTheme();
    return (
        <Tooltip title={`Відкрити ${label} ${number}`} placement="top">
            <Box
                onClick={onClick}
                sx={{
                    display: 'inline-flex', alignItems: 'center', gap: 0.5,
                    px: 1, py: 0.35,
                    borderRadius: 1.5,
                    border: `1px solid ${alpha(color, 0.3)}`,
                    bgcolor: alpha(color, 0.06),
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                        bgcolor: alpha(color, 0.14),
                        borderColor: alpha(color, 0.6),
                        transform: 'translateY(-1px)',
                        boxShadow: `0 2px 6px ${alpha(color, 0.2)}`,
                    },
                }}
            >
                {React.cloneElement(icon, { sx: { fontSize: 12, color } })}
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color, lineHeight: 1 }}>
                    {label}
                </Typography>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color, lineHeight: 1 }}>
                    {number}
                </Typography>
                <OpenInNew sx={{ fontSize: 10, color: alpha(color, 0.6) }} />
            </Box>
        </Tooltip>
    );
};

const ShipmentCard = ({
    s, mainColor, statusColors,
    isHistoryExpanded, isFinanceExpanded, history,
    onDelete, onToggleHistory, onToggleFinance,
    onEdit, editable = true,
}) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const statusColor = statusColors[s.shipmentStatusName] || statusColors.default;
    const [returnOpen, setReturnOpen] = useState(false);

    const canReturn = ['Доставлено'].includes(s.shipmentStatusName);

    const handleWaybillClick = () => {
        if (s.waybillId) {
            navigate(`/waybills?highlight=${s.waybillId}`);
        }
    };

    const handleRouteListClick = () => {
        if (s.routeListId) {
            navigate(`/route-lists?highlight=${s.routeListId}`);
        }
    };

    const hasLinkedDocs = s.waybillId || s.routeListId;

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

                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {canReturn && (
                            <Tooltip title="Оформити повернення">
                                <IconButton
                                    size="small"
                                    onClick={() => setReturnOpen(true)}
                                    sx={{ color: '#f44336' }}
                                >
                                    <AssignmentReturn fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}

                        <Tooltip title={editable ? 'Редагувати' : `Редагування недоступне для статусу "${s.shipmentStatusName}"`}>
                            <span>
                                <IconButton
                                    size="small"
                                    onClick={() => editable && onEdit?.(s)}
                                    disabled={!editable}
                                    sx={{
                                        color: editable ? mainColor : '#ccc',
                                        '&.Mui-disabled': { color: '#ccc' }
                                    }}
                                >
                                    <Edit fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>

                        <Tooltip title={editable ? 'Видалити' : 'Видалення недоступне'}>
                            <span>
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => editable && onDelete(s.id)}
                                    disabled={!editable}
                                >
                                    <Delete fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Box>
                </Box>

                <Typography variant="h6" fontWeight="700" sx={{ mb: 0.5, lineHeight: 1.2 }}>
                    {s.parcelDescription || 'Без опису'}
                </Typography>

                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1 }}>
                    {s.shipmentTypeName && (() => {
                        const typeColor = getTypeColor(SHIPMENT_TYPE_COLORS, s.shipmentTypeName);
                        return (
                            <Chip
                                icon={<LocalShipping sx={{ fontSize: '13px !important', color: `${typeColor} !important` }} />}
                                label={s.shipmentTypeName}
                                size="small"
                                sx={{
                                    height: 20, fontSize: '0.65rem', fontWeight: 700,
                                    bgcolor: alpha(typeColor, 0.07), color: typeColor,
                                    border: `1px solid ${alpha(typeColor, 0.2)}`,
                                }}
                            />
                        );
                    })()}
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

                {hasLinkedDocs && (
                    <Box sx={{
                        mb: 1.5, p: 1, borderRadius: 2,
                        bgcolor: alpha(theme.palette.text.primary, 0.02),
                        border: `1px solid ${alpha(theme.palette.text.primary, 0.06)}`,
                    }}>
                        <Typography sx={{
                            fontSize: '0.58rem', fontWeight: 800, color: 'text.disabled',
                            textTransform: 'uppercase', letterSpacing: 0.6, mb: 0.8,
                        }}>
                            Пов'язані документи
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                            {s.waybillId && s.waybillNumber && (
                                <LinkedDocChip
                                    icon={<ArticleOutlined />}
                                    label="Накладна"
                                    number={`№${s.waybillNumber}`}
                                    color={mainColor}
                                    onClick={handleWaybillClick}
                                />
                            )}
                            {s.routeListId && s.routeListNumber && (
                                <LinkedDocChip
                                    icon={<RouteOutlined />}
                                    label="Маршрутний"
                                    number={`№${s.routeListNumber}`}
                                    color={theme.palette.secondary.main}
                                    onClick={handleRouteListClick}
                                />
                            )}
                        </Box>
                    </Box>
                )}

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
                                    <b>{s.boxVariantName || 'Коробка'}</b>
                                    {` · ${s.boxVariantDimensions}`}
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

                                {s.returns?.length > 0 && (
                                    <Box sx={{ mt: 0.5 }}>
                                        <Typography variant="caption" sx={{
                                            fontSize: '0.58rem', fontWeight: 800, color: 'text.disabled',
                                            textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.5,
                                        }}>
                                            Повернення
                                        </Typography>
                                        {s.returns.map(r => (
                                            <Box key={r.id} sx={{
                                                p: 0.8, borderRadius: 1,
                                                bgcolor: alpha('#f44336', 0.03),
                                                borderLeft: `2px solid #f44336`,
                                                display: 'flex', justifyContent: 'space-between',
                                                mb: 0.5,
                                            }}>
                                                <Box>
                                                    <Typography variant="caption" sx={{
                                                        fontWeight: 800, display: 'block', lineHeight: 1, color: '#f44336',
                                                    }}>
                                                        -{r.refundAmount} ₴
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ fontSize: '0.55rem', color: 'text.secondary' }}>
                                                        {r.returnReasonName}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.disabled' }}>
                                                    {new Date(r.initiationDate).toLocaleDateString()}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
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

            <ReturnDialog
                open={returnOpen}
                onClose={() => setReturnOpen(false)}
                shipment={s}
                onSuccess={(msg) => {
                    setReturnOpen(false);
                    onSuccess?.(msg);
                }}
            />
        </Card>
    );
};

export default ShipmentCard;
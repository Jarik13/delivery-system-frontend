import React, { useState } from 'react';
import {
    Box, Typography, Chip, alpha, IconButton, Tooltip, CircularProgress,
} from '@mui/material';
import {
    CheckCircle, LocalShipping, PendingActions, Cancel,
    RadioButtonUnchecked, TaskAlt, ErrorOutline, LocationOn, MyLocation
} from '@mui/icons-material';
import { SHIPMENT_STATUS_COLORS, getStatusColor } from '../../constants/statusColors';
import { DictionaryApi } from '../../api/dictionaries';
import ReturnDialog from './ReturnDialog';
import PaymentDialog from './PaymentDialog';

const STATUS_ICONS = {
    'Доставлено': CheckCircle,
    'Видано кур\'єру': LocalShipping,
    'Спроба вручення провалена': PendingActions,
    'Відмова': Cancel,
    'У процесі доставки': RadioButtonUnchecked,
};

const ACTIONABLE_STATUSES = ['Видано кур\'єру', 'Спроба вручення провалена', 'У процесі доставки'];

const ShipmentCard = ({ item, routeListId, paymentTypes, onStatusChange, onNotify }) => {
    const [loading, setLoading] = useState(false);
    const [returnOpen, setReturnOpen] = useState(false);
    const [paymentOpen, setPaymentOpen] = useState(false);

    const statusName = item.shipmentStatusName || (item.isDelivered ? 'Доставлено' : 'У процесі доставки');
    const color = getStatusColor(SHIPMENT_STATUS_COLORS, statusName);
    const Icon = STATUS_ICONS[statusName] || RadioButtonUnchecked;
    const canAct = ACTIONABLE_STATUSES.includes(statusName);

    const handleAction = async (action) => {
        if (!routeListId || !item.id) return;

        if (action === 'REFUSED') {
            setReturnOpen(true);
            return;
        }

        setLoading(true);
        try {
            const response = await DictionaryApi.patch(`route-lists/items/${item.id}/status`, { action });
            const updatedItem = response.data;

            const isDelivered = action === 'DELIVERED';

            const hasMoney = Number(updatedItem.remainingAmount || updatedItem.codAmount || 0) > 0;
            const needsCod = updatedItem.hasCod === true || hasMoney;

            if (isDelivered && needsCod && hasMoney) {
                setPaymentOpen(true);
            } else {
                onStatusChange?.();
            }
        } catch (e) {
            onNotify?.('Помилка оновлення статусу', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleReturnSuccess = (msg) => {
        DictionaryApi.patch(`route-lists/items/${item.id}/status`, { action: 'REFUSED' })
            .catch(console.error)
            .finally(() => {
                onStatusChange?.();
                onNotify?.(msg, 'success');
            });
    };

    return (
        <>
            <Box sx={{
                display: 'flex', alignItems: 'flex-start', gap: 1.5,
                p: 1.5, borderRadius: 2,
                bgcolor: alpha(color, 0.05),
                border: `1px solid ${alpha(color, 0.15)}`,
                mb: 1,
            }}>
                <Box sx={{
                    mt: 0.3, width: 32, height: 32, borderRadius: '50%',
                    bgcolor: alpha(color, 0.12),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <Icon sx={{ fontSize: 16, color }} />
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" sx={{
                        fontFamily: 'monospace', fontWeight: 700,
                        bgcolor: alpha('#000', 0.06), px: 0.75, py: 0.2,
                        borderRadius: 0.75, fontSize: 11, color: 'text.secondary',
                    }}>
                        {item.trackingNumber}
                    </Typography>

                    <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5, lineHeight: 1.3 }}>
                        {item.recipientFullName || '—'}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mt: 0.25 }}>
                        <MyLocation sx={{ fontSize: 12, color: 'text.disabled', mt: 0.15, flexShrink: 0 }} />
                        <Typography variant="caption" color="text.secondary">
                            {item.deliveryAddress || '—'}
                        </Typography>
                    </Box>

                    {item.destinationAddress && (
                        <Box sx={{
                            display: 'flex', alignItems: 'flex-start', gap: 0.5,
                            mt: 0.5, p: '4px 8px',
                            borderRadius: 1,
                            bgcolor: alpha('#2196f3', 0.06),
                            border: `1px solid ${alpha('#2196f3', 0.18)}`,
                        }}>
                            <LocationOn sx={{ fontSize: 12, color: '#2196f3', mt: 0.15, flexShrink: 0 }} />
                            <Typography variant="caption" sx={{ color: '#2196f3', fontWeight: 600, fontSize: 11, lineHeight: 1.4 }}>
                                {item.destinationAddress}
                            </Typography>
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75, flexWrap: 'wrap' }}>
                        <Chip
                            label={statusName}
                            size="small"
                            sx={{
                                height: 20, fontSize: 10, fontWeight: 700,
                                bgcolor: alpha(color, 0.1), color,
                                border: `1px solid ${alpha(color, 0.25)}`,
                            }}
                        />
                        {item.weight != null && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                                {item.weight} кг
                            </Typography>
                        )}
                        {item.hasCod && item.remainingAmount > 0 && (
                            <Chip
                                label={`Накладний: ${item.remainingAmount} ₴`}
                                size="small"
                                sx={{
                                    height: 20, fontSize: 10, fontWeight: 700,
                                    bgcolor: alpha('#ff9800', 0.1), color: '#ff9800',
                                    border: `1px solid ${alpha('#ff9800', 0.3)}`,
                                }}
                            />
                        )}
                        {item.deliveredAt && (
                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10, whiteSpace: 'nowrap' }}>
                                {new Date(item.deliveredAt).toLocaleString('uk-UA', {
                                    day: '2-digit', month: '2-digit',
                                    hour: '2-digit', minute: '2-digit',
                                })}
                            </Typography>
                        )}
                    </Box>

                    {canAct && (
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                            {loading ? (
                                <CircularProgress size={18} sx={{ color: '#4caf50' }} />
                            ) : (
                                <>
                                    <Tooltip title="Доставлено">
                                        <IconButton size="small" onClick={() => handleAction('DELIVERED')}
                                            sx={{
                                                bgcolor: alpha('#4caf50', 0.1), color: '#4caf50',
                                                border: `1px solid ${alpha('#4caf50', 0.3)}`,
                                                borderRadius: 1.5, p: 0.5,
                                                '&:hover': { bgcolor: alpha('#4caf50', 0.2) },
                                            }}>
                                            <TaskAlt sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Tooltip>

                                    {statusName !== 'Спроба вручення провалена' && (
                                        <Tooltip title="Спроба вручення провалена">
                                            <IconButton size="small" onClick={() => handleAction('FAILED')}
                                                sx={{
                                                    bgcolor: alpha('#ff9800', 0.1), color: '#ff9800',
                                                    border: `1px solid ${alpha('#ff9800', 0.3)}`,
                                                    borderRadius: 1.5, p: 0.5,
                                                    '&:hover': { bgcolor: alpha('#ff9800', 0.2) },
                                                }}>
                                                <ErrorOutline sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Tooltip>
                                    )}

                                    <Tooltip title="Відмова — оформити повернення">
                                        <IconButton size="small" onClick={() => handleAction('REFUSED')}
                                            sx={{
                                                bgcolor: alpha('#f44336', 0.1), color: '#f44336',
                                                border: `1px solid ${alpha('#f44336', 0.3)}`,
                                                borderRadius: 1.5, p: 0.5,
                                                '&:hover': { bgcolor: alpha('#f44336', 0.2) },
                                            }}>
                                            <Cancel sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Tooltip>
                                </>
                            )}
                        </Box>
                    )}
                </Box>
            </Box>

            <ReturnDialog
                open={returnOpen}
                onClose={() => setReturnOpen(false)}
                item={item}
                onSuccess={handleReturnSuccess}
            />

            <PaymentDialog
                open={paymentOpen}
                onClose={() => { setPaymentOpen(false); onStatusChange?.(); }}
                item={item}
                paymentTypes={paymentTypes}
                onSuccess={(msg) => {
                    setPaymentOpen(false);
                    onStatusChange?.();
                    onNotify?.(msg, 'success');
                }}
            />
        </>
    );
};

export default ShipmentCard;
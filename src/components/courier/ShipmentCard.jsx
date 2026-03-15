import React from 'react';
import { Box, Typography, Chip, alpha } from '@mui/material';
import { CheckCircle, LocalShipping, PendingActions, Cancel, RadioButtonUnchecked } from '@mui/icons-material';
import { SHIPMENT_STATUS_COLORS, getStatusColor } from '../../constants/statusColors';

const STATUS_ICONS = {
    'Доставлено': CheckCircle,
    'Видано кур\'єру': LocalShipping,
    'Спроба вручення провалена': PendingActions,
    'Відмова': Cancel,
    'У процесі доставки': RadioButtonUnchecked,
};

const ShipmentCard = ({ item }) => {
    const statusName = item.shipmentStatusName || (item.isDelivered ? 'Доставлено' : 'У процесі доставки');
    const color = getStatusColor(SHIPMENT_STATUS_COLORS, statusName);
    const Icon = STATUS_ICONS[statusName] || RadioButtonUnchecked;

    return (
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

                <Typography variant="caption" color="text.secondary" sx={{
                    display: 'block', mt: 0.25,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {item.deliveryAddress || 'Самовивіз з відділення'}
                </Typography>

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
                    {item.deliveredAt && (
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>
                            {new Date(item.deliveredAt).toLocaleString('uk-UA', {
                                day: '2-digit', month: '2-digit',
                                hour: '2-digit', minute: '2-digit',
                            })}
                        </Typography>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default ShipmentCard;
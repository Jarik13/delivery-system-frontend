import React from 'react';
import {
    Box, Typography, TextField, Autocomplete, Divider,
    IconButton, Tooltip, alpha,
} from '@mui/material';
import { Person, LocalShipping, PersonAdd } from '@mui/icons-material';
import { motion } from 'framer-motion';
import DeliveryPointSelector from './../DeliveryPointSelector';

const RouteStep = ({
    formData, setFormData, fieldErrors, setFieldErrors,
    mainColor, direction, variants,
    localClients, shipmentTypes,
    employeeProfile, profileLoading,
    onOpenCreateClient,
}) => {
    const selectedSender = localClients.find(c => c.id === formData.senderId) ?? null;
    const selectedRecipient = localClients.find(c => c.id === formData.recipientId) ?? null;
    const selectedShipmentType = shipmentTypes.find(t => t.id === formData.shipmentTypeId) ?? null;

    const clientOptionLabel = o => {
        const name = o.fullName || `${o.lastName || ''} ${o.firstName || ''} ${o.middleName || ''}`.trim();
        return name + (o.phoneNumber ? ` (${o.phoneNumber})` : '');
    };

    const originLocked = !profileLoading && employeeProfile !== null;

    const AddClientButton = ({ forRole }) => (
        <Tooltip title="Створити нового клієнта">
            <IconButton
                size="small"
                onClick={() => onOpenCreateClient(forRole)}
                sx={{
                    mt: 0.5, flexShrink: 0,
                    color: mainColor,
                    bgcolor: alpha(mainColor, 0.08),
                    border: `1px solid ${alpha(mainColor, 0.2)}`,
                    borderRadius: 1.5,
                    '&:hover': { bgcolor: alpha(mainColor, 0.15) },
                }}
            >
                <PersonAdd fontSize="small" />
            </IconButton>
        </Tooltip>
    );

    return (
        <motion.div key="s1" custom={direction} variants={variants} initial="enter" animate="center" exit="exit">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography variant="subtitle2" sx={{
                    color: '#666', fontWeight: 800,
                    display: 'flex', alignItems: 'center', gap: 1, textTransform: 'uppercase',
                }}>
                    <Person sx={{ color: mainColor, fontSize: 18 }} /> Учасники та тип доставки
                </Typography>

                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-start', flex: '1 1 260px', minWidth: 0 }}>
                        <Autocomplete
                            fullWidth
                            options={localClients}
                            value={selectedSender}
                            getOptionLabel={clientOptionLabel}
                            onChange={(_, v) => {
                                setFormData(prev => ({ ...prev, senderId: v?.id ?? null }));
                                setFieldErrors(prev => ({ ...prev, senderId: null }));
                            }}
                            renderInput={p => (
                                <TextField {...p} label="Відправник" size="small"
                                    error={!!fieldErrors.senderId}
                                    helperText={fieldErrors.senderId}
                                />
                            )}
                        />
                        <AddClientButton forRole="sender" />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-start', flex: '1 1 260px', minWidth: 0 }}>
                        <Autocomplete
                            fullWidth
                            options={localClients}
                            value={selectedRecipient}
                            getOptionLabel={clientOptionLabel}
                            onChange={(_, v) => {
                                setFormData(prev => ({ ...prev, recipientId: v?.id ?? null }));
                                setFieldErrors(prev => ({ ...prev, recipientId: null }));
                            }}
                            renderInput={p => (
                                <TextField {...p} label="Отримувач" size="small"
                                    error={!!fieldErrors.recipientId}
                                    helperText={fieldErrors.recipientId}
                                />
                            )}
                        />
                        <AddClientButton forRole="recipient" />
                    </Box>

                    <Box sx={{ flex: '1 1 160px', minWidth: 0 }}>
                        <Autocomplete
                            fullWidth
                            options={shipmentTypes}
                            value={selectedShipmentType}
                            getOptionLabel={o => o.name || ''}
                            onChange={(_, v) => {
                                setFormData(prev => ({ ...prev, shipmentTypeId: v?.id ?? null }));
                                setFieldErrors(prev => ({ ...prev, shipmentTypeId: null }));
                            }}
                            renderInput={p => (
                                <TextField {...p} label="Тип доставки" size="small"
                                    error={!!fieldErrors.shipmentTypeId}
                                    helperText={fieldErrors.shipmentTypeId}
                                />
                            )}
                        />
                    </Box>
                </Box>

                <Divider />

                <DeliveryPointSelector
                    point={formData.origin}
                    label="Звідки"
                    locked={originLocked}
                    lockedLabel={employeeProfile?.branch?.name}
                    onChange={v => setFormData(prev => ({ ...prev, origin: v }))}
                    errors={{
                        cityId: fieldErrors['origin.cityId'],
                        deliveryPointId: fieldErrors['origin.deliveryPointId'],
                    }}
                    onClearError={() => setFieldErrors(prev => ({
                        ...prev,
                        'origin.cityId': null,
                        'origin.deliveryPointId': null,
                    }))}
                />

                <DeliveryPointSelector
                    point={formData.destination}
                    label="Куди"
                    onChange={v => setFormData(prev => ({ ...prev, destination: v }))}
                    errors={{
                        cityId: fieldErrors['destination.cityId'],
                        deliveryPointId: fieldErrors['destination.deliveryPointId'],
                    }}
                    onClearError={() => setFieldErrors(prev => ({
                        ...prev,
                        'destination.cityId': null,
                        'destination.deliveryPointId': null,
                    }))}
                />
            </Box>
        </motion.div>
    );
};

export default RouteStep;
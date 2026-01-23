import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    Drawer, Toolbar, List, ListItemButton, ListItemText, 
    ListItem, Collapse, TextField, InputAdornment, Box, IconButton, Divider
} from '@mui/material';
import { 
    ExpandLess, ExpandMore, Search, Clear,
    Business, Apartment, LocalPostOffice, LocalShipping, DirectionsCar, AttachMoney,
    LocationCity, Category, People, Inventory,
    LocalAtm, Assignment, Public, Place, Home, 
    LocationOn, Route, Badge, DeliveryDining,
    Payments, AssignmentReturned, LocalConvenienceStore,
    AirportShuttle, AirlineSeatReclineNormal, DirectionsBus,
    BuildCircle, SettingsEthernet, SettingsInputComponent, EvStation,
    DirectionsCarFilled, DirectionsCarOutlined,
    Schedule, AccessTime, AllInbox, TrackChanges, AcUnit, HelpOutline, 
    TripOrigin, ListAlt, ChecklistRtl, Event, Inbox, Storage
} from '@mui/icons-material';

import { MENU_GROUPS } from '../constants/dictionaries';

const drawerWidth = 280;

const groupIcons = {
    "Мережа доставки": <Business sx={{ mr: 2, color: '#2196f3', fontSize: '1.2rem' }} />,
    "Відділення": <Apartment sx={{ mr: 2, color: '#4caf50', fontSize: '1.2rem' }} />,
    "Поштомати": <LocalPostOffice sx={{ mr: 2, color: '#ff9800', fontSize: '1.2rem' }} />,
    "Вантажі та Пакування": <LocalShipping sx={{ mr: 2, color: '#9c27b0', fontSize: '1.2rem' }} />,
    "Автопарк (Fleet)": <DirectionsCar sx={{ mr: 2, color: '#f44336', fontSize: '1.2rem' }} />,
    "Організація та Фінанси": <AttachMoney sx={{ mr: 2, color: '#009688', fontSize: '1.2rem' }} />
};

const itemIcons = {
    // ========== МЕРЕЖА ДОСТАВКИ ==========
    "regions": <Public sx={{ mr: 2, fontSize: 'small', color: '#1976d2' }} />,
    "districts": <Place sx={{ mr: 2, fontSize: 'small', color: '#2196f3' }} />,
    "cities": <LocationCity sx={{ mr: 2, fontSize: 'small', color: '#03a9f4' }} />,
    "streets": <Route sx={{ mr: 2, fontSize: 'small', color: '#00bcd4' }} />,
    "address-houses": <Home sx={{ mr: 2, fontSize: 'small', color: '#0097a7' }} />,
    
    // ========== ВІДДІЛЕННЯ ==========
    "branches": <Apartment sx={{ mr: 2, fontSize: 'small', color: '#388e3c' }} />,
    "branch-types": <LocalConvenienceStore sx={{ mr: 2, fontSize: 'small', color: '#689f38' }} />,
    "work-schedules": <Schedule sx={{ mr: 2, fontSize: 'small', color: '#7cb342' }} />,
    "work-time-intervals": <AccessTime sx={{ mr: 2, fontSize: 'small', color: '#afb42b' }} />,
    "delivery-points": <LocationOn sx={{ mr: 2, fontSize: 'small', color: '#558b2f' }} />,
    
    // ========== ПОШТОМАТИ ==========
    "postomats": <AllInbox sx={{ mr: 2, fontSize: 'small', color: '#ff9800' }} />,
    
    // ========== ВАНТАЖІ ТА ПАКУВАННЯ ==========
    "shipments": <LocalShipping sx={{ mr: 2, fontSize: 'small', color: '#8e24aa' }} />,
    "parcels": <Inventory sx={{ mr: 2, fontSize: 'small', color: '#7b1fa2' }} />,
    "parcel-types": <Category sx={{ mr: 2, fontSize: 'small', color: '#6a1b9a' }} />,
    "box-types": <Inbox sx={{ mr: 2, fontSize: 'small', color: '#4a148c' }} />,
    "box-variants": <Storage sx={{ mr: 2, fontSize: 'small', color: '#38006b' }} />,
    "shipment-types": <Category sx={{ mr: 2, fontSize: 'small', color: '#9c27b0' }} />,
    "shipment-statuses": <TrackChanges sx={{ mr: 2, fontSize: 'small', color: '#ab47bc' }} />,
    "storage-conditions": <AcUnit sx={{ mr: 2, fontSize: 'small', color: '#ba68c8' }} />,
    "returns": <AssignmentReturned sx={{ mr: 2, fontSize: 'small', color: '#ce93d8' }} />,
    "return-reasons": <HelpOutline sx={{ mr: 2, fontSize: 'small', color: '#e1bee7' }} />,
    
    // ========== АВТОПАРК (FLEET) ==========
    "fleets": <DirectionsCarFilled sx={{ mr: 2, fontSize: 'small', color: '#d32f2f' }} />,
    "vehicles": <DirectionsCarOutlined sx={{ mr: 2, fontSize: 'small', color: '#f44336' }} />,
    "fleet-brands": <DirectionsCar sx={{ mr: 2, fontSize: 'small', color: '#ef5350' }} />,
    "fleet-body-types": <AirportShuttle sx={{ mr: 2, fontSize: 'small', color: '#e53935' }} />,
    "fleet-fuel-types": <EvStation sx={{ mr: 2, fontSize: 'small', color: '#d81b60' }} />,
    "fleet-transmission-types": <SettingsInputComponent sx={{ mr: 2, fontSize: 'small', color: '#c2185b' }} />,
    "fleet-drive-types": <SettingsEthernet sx={{ mr: 2, fontSize: 'small', color: '#ad1457' }} />,
    "vehicle-activity-statuses": <BuildCircle sx={{ mr: 2, fontSize: 'small', color: '#880e4f' }} />,
    "drivers": <AirlineSeatReclineNormal sx={{ mr: 2, fontSize: 'small', color: '#ec407a' }} />,
    "trips": <DirectionsBus sx={{ mr: 2, fontSize: 'small', color: '#f06292' }} />,
    "trip-statuses": <TripOrigin sx={{ mr: 2, fontSize: 'small', color: '#f48fb1' }} />,
    "routes": <Route sx={{ mr: 2, fontSize: 'small', color: '#f8bbd0' }} />,
    
    // ========== ОРГАНІЗАЦІЯ ТА ФІНАНСИ ==========
    "clients": <People sx={{ mr: 2, fontSize: 'small', color: '#0288d1' }} />,
    "employees": <Badge sx={{ mr: 2, fontSize: 'small', color: '#039be5' }} />,
    "couriers": <DeliveryDining sx={{ mr: 2, fontSize: 'small', color: '#03a9f4' }} />,
    "payment-types": <LocalAtm sx={{ mr: 2, fontSize: 'small', color: '#29b6f6' }} />,
    "payments": <Payments sx={{ mr: 2, fontSize: 'small', color: '#4fc3f7' }} />,
    "waybills": <Assignment sx={{ mr: 2, fontSize: 'small', color: '#81d4fa' }} />,
    "route-lists": <ListAlt sx={{ mr: 2, fontSize: 'small', color: '#b3e5fc' }} />,
    "route-list-statuses": <ChecklistRtl sx={{ mr: 2, fontSize: 'small', color: '#e1f5fe' }} />,
    "days-of-week": <Event sx={{ mr: 2, fontSize: 'small', color: '#01579b' }} />
};

const Sidebar = () => {
    const location = useLocation();
    const [searchText, setSearchText] = useState('');
    const [openGroups, setOpenGroups] = useState({});

    useEffect(() => {
        const initialOpenState = {};
        MENU_GROUPS.forEach(group => {
            initialOpenState[group.title] = false;
        });
        setOpenGroups(initialOpenState);
    }, []);

    const handleGroupClick = (groupTitle) => {
        setOpenGroups(prev => ({ ...prev, [groupTitle]: !prev[groupTitle] }));
    };

    const handleClearSearch = () => {
        setSearchText('');
    };

    const filteredMenu = MENU_GROUPS.map(group => {
        if (!searchText) return group;

        const filteredItems = group.items.filter(item => 
            item.label.toLowerCase().includes(searchText.toLowerCase())
        );

        return {
            ...group,
            items: filteredItems
        };
    }).filter(group => group.items.length > 0);

    useEffect(() => {
        if (searchText) {
            const allOpen = {};
            MENU_GROUPS.forEach(g => allOpen[g.title] = true);
            setOpenGroups(allOpen);
        }
    }, [searchText]);

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: { 
                    width: drawerWidth, 
                    boxSizing: 'border-box',
                    backgroundColor: '#f5f7fa',
                    backgroundImage: 'linear-gradient(180deg, #f5f7fa 0%, #c3cfe2 100%)',
                },
            }}
        >
            <Toolbar />
            
            <Box sx={{ p: 2, pb: 1 }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Пошук по меню..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            backgroundColor: 'white',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            '&:hover': {
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            }
                        }
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search color="primary" />
                            </InputAdornment>
                        ),
                        endAdornment: searchText && (
                            <InputAdornment position="end">
                                <IconButton 
                                    size="small" 
                                    onClick={handleClearSearch}
                                    sx={{ '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' } }}
                                >
                                    <Clear fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />
            </Box>
            <Divider sx={{ borderColor: 'rgba(0,0,0,0.08)', mx: 2 }} />

            <Box sx={{ overflow: 'auto', pt: 1 }}>
                <List component="nav" disablePadding>
                    {filteredMenu.map((group, index) => {
                        const isOpen = openGroups[group.title] || false;

                        return (
                            <React.Fragment key={index}>
                                <ListItemButton 
                                    onClick={() => handleGroupClick(group.title)} 
                                    sx={{ 
                                        bgcolor: isOpen ? 'rgba(33, 150, 243, 0.08)' : 'transparent',
                                        borderRadius: 2,
                                        mx: 1.5,
                                        my: 0.5,
                                        '&:hover': { 
                                            bgcolor: isOpen ? 'rgba(33, 150, 243, 0.12)' : 'rgba(0,0,0,0.04)',
                                            transform: 'translateY(-1px)',
                                            transition: 'all 0.2s ease'
                                        },
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {groupIcons[group.title] || <Business sx={{ mr: 2, fontSize: '1.2rem' }} />}
                                    <ListItemText 
                                        primary={group.title} 
                                        primaryTypographyProps={{ 
                                            fontWeight: isOpen ? 700 : 600,
                                            fontSize: '0.95rem',
                                            color: isOpen ? 'primary.main' : 'text.primary',
                                            letterSpacing: '0.3px'
                                        }} 
                                    />
                                    {isOpen ? 
                                        <ExpandLess sx={{ color: 'primary.main' }} /> : 
                                        <ExpandMore sx={{ color: 'text.secondary' }} />
                                    }
                                </ListItemButton>

                                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                                    <List component="div" disablePadding>
                                        {group.items.map((item) => {
                                            const isActive = location.pathname === `/${item.path}`;
                                            return (
                                                <ListItemButton 
                                                    key={item.path} 
                                                    sx={{ 
                                                        pl: 6,
                                                        borderRadius: 2,
                                                        mx: 1.5,
                                                        my: 0.25,
                                                        bgcolor: isActive ? 'rgba(103, 58, 183, 0.1)' : 'transparent',
                                                        borderLeft: isActive ? '3px solid #673ab7' : '3px solid transparent',
                                                        '&:hover': { 
                                                            bgcolor: isActive ? 'rgba(103, 58, 183, 0.15)' : 'rgba(0,0,0,0.04)',
                                                            paddingLeft: isActive ? '24px' : '21px',
                                                            transition: 'all 0.2s ease'
                                                        },
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    component={Link} 
                                                    to={`/${item.path}`}
                                                >
                                                    {itemIcons[item.path] || <Category sx={{ mr: 2, fontSize: 'small' }} />}
                                                    <ListItemText 
                                                        primary={item.label} 
                                                        primaryTypographyProps={{ 
                                                            fontSize: '0.85rem',
                                                            fontWeight: isActive ? 600 : 400,
                                                            color: isActive ? 'primary.dark' : 'text.primary'
                                                        }} 
                                                    />
                                                </ListItemButton>
                                            );
                                        })}
                                    </List>
                                    <Divider sx={{ 
                                        borderColor: 'rgba(0,0,0,0.05)', 
                                        my: 1.5,
                                        mx: 2 
                                    }} />
                                </Collapse>
                            </React.Fragment>
                        );
                    })}

                    {filteredMenu.length === 0 && (
                        <ListItem sx={{ justifyContent: 'center', py: 3 }}>
                            <ListItemText 
                                primary="Нічого не знайдено" 
                                sx={{ 
                                    textAlign: 'center',
                                    color: 'text.secondary',
                                    '& .MuiListItemText-primary': {
                                        fontStyle: 'italic'
                                    }
                                }} 
                            />
                        </ListItem>
                    )}
                </List>
            </Box>
        </Drawer>
    );
};

export default Sidebar;
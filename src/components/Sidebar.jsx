import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Drawer, Toolbar, List, ListItemButton, ListItemText,
    Collapse, TextField, InputAdornment, Box, IconButton, Divider
} from '@mui/material';
import {
    ExpandLess, ExpandMore, Search, Clear, Category
} from '@mui/icons-material';

import { MENU_GROUPS } from '../constants/dictionaries';
import { GROUP_COLORS, groupIcons, itemIcons } from '../constants/menuConfig';

const drawerWidth = 280;

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
        return { ...group, items: filteredItems };
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
                    backgroundImage: 'linear-gradient(180deg, #f5f7fa 0%, #edf2f7 100%)',
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
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        }
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search color="action" />
                            </InputAdornment>
                        ),
                        endAdornment: searchText && (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={handleClearSearch}>
                                    <Clear fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />
            </Box>
            <Divider sx={{ borderColor: 'rgba(0,0,0,0.06)', mx: 2 }} />

            <Box sx={{ overflow: 'auto', pt: 1, pb: 5 }}>
                <List component="nav" disablePadding>
                    {filteredMenu.map((group, index) => {
                        const isOpen = openGroups[group.title] || false;
                        const groupThemeColor = GROUP_COLORS[group.title] || GROUP_COLORS['default'];
                        const isGroupActive = group.items.some(item => location.pathname === `/${item.path}`);

                        return (
                            <React.Fragment key={index}>
                                <ListItemButton
                                    onClick={() => handleGroupClick(group.title)}
                                    sx={{
                                        borderRadius: 2,
                                        mx: 1.5,
                                        my: 0.5,
                                        bgcolor: 'transparent',
                                        color: (isOpen || isGroupActive) ? groupThemeColor : 'text.primary',
                                        '&:hover': {
                                            bgcolor: (isOpen || isGroupActive) ? `${groupThemeColor}0D` : 'rgba(0,0,0,0.04)',
                                        },
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {groupIcons[group.title] && React.cloneElement(groupIcons[group.title], {
                                        sx: {
                                            mr: 2,
                                            fontSize: '1.2rem',
                                            color: (isOpen || isGroupActive) ? groupThemeColor : '#757575',
                                            transition: 'color 0.3s'
                                        }
                                    })}

                                    <ListItemText
                                        primary={group.title}
                                        primaryTypographyProps={{
                                            fontWeight: (isOpen || isGroupActive) ? 700 : 500,
                                            fontSize: '0.9rem',
                                        }}
                                    />
                                    {isOpen ?
                                        <ExpandLess sx={{ color: groupThemeColor }} /> :
                                        <ExpandMore sx={{ color: 'action.disabled' }} />
                                    }
                                </ListItemButton>

                                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                                    <List component="div" disablePadding>
                                        {group.items.map((item) => {
                                            const isActive = location.pathname === `/${item.path}`;

                                            return (
                                                <ListItemButton
                                                    key={item.path}
                                                    component={Link}
                                                    to={`/${item.path}`}
                                                    sx={{
                                                        pl: 6,
                                                        borderRadius: 2,
                                                        mx: 1.5,
                                                        my: 0.25,
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        bgcolor: isActive ? `${groupThemeColor}1F` : 'transparent',
                                                        color: isActive ? groupThemeColor : 'text.secondary',
                                                        '&::before': isActive ? {
                                                            content: '""',
                                                            position: 'absolute',
                                                            left: 0,
                                                            top: 0,
                                                            bottom: 0,
                                                            width: '4px',
                                                            backgroundColor: groupThemeColor,
                                                        } : {},

                                                        '&:hover': {
                                                            bgcolor: isActive ? `${groupThemeColor}25` : 'rgba(0,0,0,0.03)',
                                                            color: groupThemeColor,
                                                            '& .MuiSvgIcon-root': {
                                                                color: groupThemeColor
                                                            }
                                                        },
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    {itemIcons[item.path] ?
                                                        React.cloneElement(itemIcons[item.path], {
                                                            sx: {
                                                                mr: 2,
                                                                fontSize: '1.1rem',
                                                                color: isActive ? groupThemeColor : '#9e9e9e',
                                                                transition: 'color 0.2s'
                                                            }
                                                        })
                                                        : <Category sx={{ mr: 2, fontSize: 'small', color: '#9e9e9e' }} />
                                                    }

                                                    <ListItemText
                                                        primary={item.label}
                                                        primaryTypographyProps={{
                                                            fontSize: '0.85rem',
                                                            fontWeight: isActive ? 600 : 400,
                                                        }}
                                                    />
                                                </ListItemButton>
                                            );
                                        })}
                                    </List>
                                </Collapse>
                            </React.Fragment>
                        );
                    })}
                </List>
            </Box>
        </Drawer>
    );
};

export default Sidebar;
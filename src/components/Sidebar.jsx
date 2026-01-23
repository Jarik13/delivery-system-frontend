import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    Drawer, Toolbar, List, ListItemButton, ListItemText, 
    ListItem, Collapse, TextField, InputAdornment, Box, IconButton, Divider
} from '@mui/material';
import { 
    ExpandLess, ExpandMore, Search, Clear, FolderOpen, Folder 
} from '@mui/icons-material';
import { MENU_GROUPS } from '../constants/dictionaries';

const drawerWidth = 280;

const Sidebar = () => {
    const location = useLocation();
    const [searchText, setSearchText] = useState('');
    const [openGroups, setOpenGroups] = useState({});

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
                [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
            }}
        >
            <Toolbar />
            
            <Box sx={{ p: 2 }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Пошук..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
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
            <Divider />

            <Box sx={{ overflow: 'auto' }}>
                <List component="nav">
                    {filteredMenu.map((group, index) => {
                        const isOpen = openGroups[group.title] || false;

                        return (
                            <React.Fragment key={index}>
                                <ListItemButton onClick={() => handleGroupClick(group.title)} sx={{ bgcolor: '#f9f9f9' }}>
                                    {isOpen ? <FolderOpen sx={{ mr: 2, color: 'primary.main' }} /> : <Folder sx={{ mr: 2, color: 'action.active' }} />}
                                    <ListItemText 
                                        primary={group.title} 
                                        primaryTypographyProps={{ fontWeight: 'bold', fontSize: '0.9rem' }} 
                                    />
                                    {isOpen ? <ExpandLess /> : <ExpandMore />}
                                </ListItemButton>

                                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                                    <List component="div" disablePadding>
                                        {group.items.map((item) => (
                                            <ListItemButton 
                                                key={item.path} 
                                                sx={{ pl: 4 }}
                                                component={Link} 
                                                to={`/${item.path}`}
                                                selected={location.pathname === `/${item.path}`}
                                            >
                                                <ListItemText primary={item.label} />
                                            </ListItemButton>
                                        ))}
                                    </List>
                                    <Divider />
                                </Collapse>
                            </React.Fragment>
                        );
                    })}

                    {filteredMenu.length === 0 && (
                        <ListItem>
                            <ListItemText secondary="Нічого не знайдено" sx={{ textAlign: 'center' }} />
                        </ListItem>
                    )}
                </List>
            </Box>
        </Drawer>
    );
};

export default Sidebar;
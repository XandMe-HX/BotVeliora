const themeConfig = require('../../config/theme.json');
const menusConfig = require('../../config/menus.json');

/**
 * Generate a standard sub-menu text based on category key from menus.json
 * @param {string} categoryKey - The key in menus.json (e.g. 'info', 'server')
 * @returns {string} Formatted menu text
 */
function generateSubMenu(categoryKey) {
    const menuData = menusConfig[categoryKey];
    if (!menuData) return `Menu ${categoryKey} tidak ditemukan.\n\n${themeConfig.footer}`;

    let text = `${themeConfig.headerPrefix}*[ ${menuData.title} ]*\n`;
    
    menuData.commands.forEach(cmd => {
        text += `${themeConfig.menuDivider}${cmd}\n`;
    });
    
    text += `${themeConfig.menuEnd}\n\n`;
    text += themeConfig.footer;
    
    return text;
}

module.exports = {
    generateSubMenu
};

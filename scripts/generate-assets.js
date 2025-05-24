const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Ensure directories exist
const dirs = [
    'assets/icons/feature',
    'assets/icons/notification',
    'assets/icons/tab',
    'assets/images/empty-states',
    'assets/images/backgrounds',
    'assets/animations',
    'assets/store/app-store',
    'assets/store/play-store'
];

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Generate app icons
async function generateAppIcons() {
    const sizes = {
        'icon.png': 1024,
        'adaptive-icon.png': 1024,
        'favicon.png': 32,
        'splash-icon.png': 1242
    };

    for (const [filename, size] of Object.entries(sizes)) {
        await sharp('assets/icon.svg')
            .resize(size, size)
            .png()
            .toFile(`assets/${filename}`);
    }
}

// Generate feature icons
async function generateFeatureIcons() {
    const icons = [
        'income',
        'expenses',
        'goals',
        'budget',
        'savings',
        'investment',
        'debt',
        'reports'
    ];

    for (const icon of icons) {
        await sharp('assets/icon.svg')
            .resize(24, 24)
            .png()
            .toFile(`assets/icons/feature/${icon}.png`);
    }
}

// Generate notification icons
async function generateNotificationIcons() {
    const icons = [
        'alert',
        'success',
        'warning',
        'info'
    ];

    for (const icon of icons) {
        await sharp('assets/icon.svg')
            .resize(24, 24)
            .png()
            .toFile(`assets/icons/notification/${icon}.png`);
    }
}

// Generate tab bar icons
async function generateTabIcons() {
    const tabs = [
        'home',
        'transactions',
        'budget',
        'profile',
        'insights'
    ];

    for (const tab of tabs) {
        // Active state
        await sharp('assets/icon.svg')
            .resize(24, 24)
            .png()
            .toFile(`assets/icons/tab/${tab}-active.png`);
        
        // Inactive state
        await sharp('assets/icon.svg')
            .resize(24, 24)
            .png()
            .toFile(`assets/icons/tab/${tab}-inactive.png`);
    }
}

// Main function
async function generateAllAssets() {
    try {
        await generateAppIcons();
        await generateFeatureIcons();
        await generateNotificationIcons();
        await generateTabIcons();
        console.log('All assets generated successfully!');
    } catch (error) {
        console.error('Error generating assets:', error);
    }
}

generateAllAssets(); 
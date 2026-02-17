// Mi Negocio AVEMARÍA — Mobile Theme / Design Tokens

export const colors = {
    cream: '#FAF8F4',
    cream2: '#F2EDE4',
    white: '#FFFFFF',
    gold: '#C8A96E',
    gold2: '#A8884A',
    gold3: '#E8D5A8',
    goldBg: '#FBF6EE',
    ink: '#1A1714',
    ink2: '#3D3830',
    ink3: '#7A7268',
    ink4: '#B0A898',
    border: '#EDE8DF',
    green: '#1E6B42',
    green2: '#2A9E5E',
    greenBg: '#EEF7F2',
    red: '#8B2222',
    red2: '#C0392B',
    redBg: '#FBF0F0',
    ig: '#E1306C',
    wa: '#25D366',
};

export const fonts = {
    regular: 'System',
    bold: 'System',
    mono: 'Courier',
};

export function formatCOP(value: number): string {
    return '$' + Math.round(value).toLocaleString('es-CO');
}

export function formatPercent(value: number): string {
    return value.toFixed(1).replace('.', ',') + '%';
}

export const channelConfig: Record<string, { label: string; color: string; icon: string }> = {
    WHATSAPP: { label: 'WhatsApp', color: '#25D366', icon: '💬' },
    INSTAGRAM: { label: 'Instagram', color: '#E1306C', icon: '📸' },
    PRESENCIAL: { label: 'Presencial', color: '#C8A96E', icon: '🏬' },
};

export const categoryIcons: Record<string, string> = {
    CANDONGAS: '✨', TOPOS: '🌸', GRANDES: '👑', SETS: '💎',
    EARCUFFS: '🌙', COLLARES: '📿', PULSERAS: '💫', OTRO: '🎀',
};

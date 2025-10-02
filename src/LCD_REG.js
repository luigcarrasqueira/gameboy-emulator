const LCD_REG = Object.freeze({
    LCDC: 0xFF40, // LCD Control
    STAT: 0xFF41, // LCD Status
    SCY:  0xFF42, // Scroll Y
    SCX:  0xFF43, // Scroll X
    LY:   0xFF44, // Line Y
    LYC:  0xFF45, // Line Y Compare
    DMA:  0xFF46, // DMA Transfer
    BGP:  0xFF47, // Background Palette
    OBP0: 0xFF48, // Object Palette 0
    OBP1: 0xFF49, // Object Palette 1
    WY:   0xFF4A, // Window Y
    WX:   0xFF4B  // Window X
});

export default LCD_REG;
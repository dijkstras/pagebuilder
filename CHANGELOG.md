# Changelog

All notable changes to the Page Builder project will be documented in this file.

## [0.2.0] - March 31, 2026 (Session 2)

### Added
- Full page hierarchy visible in structure tree with visual icons (📄 📦 📋 📝 🖼️ 🔘 🃏)
- Blue "+" dropdown buttons for adding elements (replaces multi-row button layout)
- Multi-column support (1-4 columns) for segments and containers
- Content alignment settings (left, center, right) for segments and containers
- Background image URL support for segments and containers
- Padding settings for containers
- Page-level clickable to view and edit page settings
- Default 200px height for segments so they render visibly
- Background colors now properly visible on segments with flex layout

### Changed
- Page level now only allows adding segments (not direct content)
- Segment and container settings now unified (both have bgColor, bgImage, padding, columns, contentAlignment)
- Improved HTML/CSS generation for multi-column layouts using grid/flex
- StructureTree UI with better visual hierarchy and spacing

### Fixed
- Segments now render with proper background colors
- Dropdown menus now visible with proper styling
- Content alignment properly applied in rendered output

### Architecture
- Updated `pageTypes.js`: createSegment and createContainer now include columns and contentAlignment
- Enhanced `pageGenerator.js`: renderSegment and renderContainer support multi-column layouts and content alignment
- Refactored settings components: SegmentSettings and ContainerSettings now have consistent controls
- StructureTree component now uses dropdown menus instead of button rows

## [0.1.0] - March 31, 2026 (Session 1 - Initial Release)

### Added
- Complete three-panel editor interface (structure tree, preview, settings)
- React Context-based state management with useReducer
- Page → Segment → Container → Content hierarchy
- Four content types: Text, Image, Button, Card
- Global brand/styles system (colors, fonts, button styles, shapes)
- Live HTML/CSS preview in iframe
- Save/load pages to localStorage
- Responsive output with mobile/tablet/desktop breakpoints
- 10 comprehensive test cases for page generator
- Comprehensive documentation and README

### Components
- StructureTree (left panel) with tree view
- Preview (center panel) with live preview
- SettingsPanel (right panel) with element-specific forms
- Editor with toolbar and save/load dialogs
- PageSettings, SegmentSettings, ContainerSettings, ContentSettings forms

### Services
- pageGenerator: Converts page model to HTML/CSS
- googleDrive: Save/load interface (localStorage fallback for MVP)

### Testing
- 10 passing test cases covering page generation
- HTML structure validation
- Content type rendering
- Responsive breakpoint generation

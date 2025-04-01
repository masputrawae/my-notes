# My Notes Theme

A clean, modern Hugo theme tailored for personal knowledge management and note-taking. It supports multilingual content and provides flexible organization options.

## Features

- 🎨 **Clean and modern design** for distraction-free reading
- 🌍 **Multilingual support** with 16+ languages
- 📂 **Flexible content organization** using multiple archetypes
- 🖋️ **Markdown-based content creation** for simplicity
- 🌙 **Dark/Light theme toggle** for better accessibility
- 🔍 **Easy navigation** with robust taxonomy support
- 📱 **Responsive design** for seamless use on all devices
- 🛠️ **Highly customizable** via configuration files

## Installation

1. Add the theme to your Hugo site:
   ```bash
   git submodule add git@github.com:masputrawae/my-notes.git themes/my-notes-theme
   ```

2. Update your site's `config.toml`:
   ```toml
   theme = "my-notes-theme"
   ```

3. Copy the example content to your site:
   ```bash
   cp -r themes/my-notes-theme/exampleSite/content/* content/
   ```

4. Start the development server:
   ```bash
   hugo server -D
   ```

## Configuration

### Basic Configuration
Customize your site by editing files in `config/_default/`:
- Set your **site title** and **description**
- Add **author information** and **social media links**
- Configure **language settings**

### Menu Configuration
Define menus in `config/_default/`:
- Create language-specific menu files (e.g., `menus.en.toml`)
- Add menu items with translations for multilingual support

### Style Customization
Modify the theme's appearance by editing SCSS files in `assets/sass/`:
- Adjust **colors** and **typography**
- Tweak **layout** and **spacing**
- Customize **component styles**

---

For more details, refer to the [official documentation](https://github.com/masputrawae/my-notes).
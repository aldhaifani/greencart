# GreenCart 🌱

GreenCart is a Chrome extension that helps users make environmentally conscious shopping decisions by calculating and displaying the CO2 footprint of products on Amazon. By providing real-time carbon impact estimates, GreenCart empowers users to understand and consider the environmental impact of their online purchases.

## Features

- 🔍 Real-time CO2 footprint calculation for Amazon products
- 📊 Product history tracking with sorting and filtering options
- 📱 Clean, responsive user interface
- 📈 CSV export functionality for analyzed products
- 🌐 Support for multiple Amazon regional domains
- 🔐 Secure API key management

## Installation

> Currently under review by the Chrome Extension Store.

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/greencart.git
   cd greencart
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Build the extension:

   ```bash
   pnpm build
   ```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory from the project

## Usage

1. After installation, you'll need to set up your Google Gemini API key:

   - Click the GreenCart icon in your Chrome toolbar
   - Complete the onboarding process
   - Enter your Gemini API key (obtain one from [Google AI Studio](https://ai.google.dev/))

2. Browse Amazon products:

   - The extension will automatically analyze products you view
   - A clean overlay will display the estimated CO2 footprint
   - View detailed product information and environmental impact

3. Access your product history:
   - Click the extension icon
   - View all analyzed products
   - Sort and filter by various criteria
   - Export data as CSV

## Technical Stack

- **Frontend Framework**: React with TypeScript
- **Styling**: TailwindCSS
- **Build Tool**: Vite
- **AI Integration**: Google Gemini API
- **Package Manager**: pnpm

## Project Structure

```
├── src/
│   ├── components/     # React components
│   ├── services/       # API and business logic
│   ├── lib/           # Utility functions
│   ├── content-script.ts   # Content script for Amazon pages
│   ├── background.ts   # Service worker
│   └── popup.tsx      # Extension popup UI
└── public/            # Static assets
```


## Inspiration

GreenCart was born out of environmental concerns and the realization that we often make purchases without understanding their environmental impact. While many aspects contribute to environmental challenges, understanding a product's CO2 footprint can provide valuable insight into our overall impact. The lack of readily available environmental impact information on major e-commerce platforms like Amazon inspired the creation of GreenCart.

## Learning Journey

Developing GreenCart provided valuable learning opportunities:

- **TypeScript**: Enhanced code reliability through strong typing
- **TailwindCSS**: Mastered responsive design and clean UI implementation
- **Gemini API**: Explored AI capabilities for environmental impact analysis
- **Chrome Extensions**: Advanced from basic to feature-rich extension development

## Challenges and Solutions

### CO2 Calculation Accuracy

- **Challenge**: Obtaining accurate CO2 footprint values for diverse products
- **Solution**: Leveraged Google's Gemini AI for intelligent product analysis, with plans for future improvements through more specialized databases

### Frontend Development

- **Challenge**: Creating a polished, intuitive user interface
- **Solution**: Utilized TailwindCSS for consistent styling and responsive design, implementing best practices for Chrome extension UI

### Multi-enpoints Compatibility

- **Challenge**: Ensuring consistent functionality across different Amazon domains
- **Solution**: Implemented robust content scripts with domain handling

## Future Improvements

1. **Enhanced CO2 Calculation**

   - Integration with specialized carbon footprint databases
   - More accurate product analysis algorithms
   - Improved consistency in API responses

2. **Expanded Store Support**

   - Add support for other major e-commerce platforms
   - Implement platform-specific data extraction

3. **Advanced Features**
   - Product comparison tools
   - Environmental impact reports
   - Alternative product suggestions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Gemini API for providing AI capabilities
- The open-source community for various tools and libraries
- Environmental consciousness initiatives that inspired this project

---

Built with 💚, by [Tareq](https://www.linkedin.com/in/aldhaifani/), for a more sustainable future

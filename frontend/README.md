# Voice Command Shopping Assistant - Frontend

A modern, responsive React frontend for the Voice Command Shopping Assistant. This application provides an intuitive interface for managing shopping wishlists through voice commands and AI-powered recommendations.

## 🚀 Features

### 🎤 Voice Commands
- **Real-time Voice Recording**: Record voice commands using your microphone
- **AI Processing**: Advanced speech-to-text and natural language processing
- **Command Confirmation**: Review parsed commands before execution
- **Visual Feedback**: Animated audio visualizer during recording
- **Error Handling**: Graceful fallback for unsupported browsers

### 📝 Wishlist Management
- **Smart Display**: Beautiful card-based wishlist interface
- **Search & Filter**: Find items by name or category
- **Statistics Dashboard**: View wishlist analytics and insights
- **Manual Actions**: Add/remove items manually when voice isn't available
- **Real-time Updates**: Instant synchronization with backend

### 🤖 AI Recommendations
- **Personalized Suggestions**: ML-powered product recommendations
- **Smart Caching**: Optimized performance with intelligent caching
- **Category Insights**: Browse recommendations by product category
- **Quick Add**: One-click addition to wishlist
- **Auto-refresh**: Fresh recommendations based on wishlist changes

### 👤 User Management
- **Multi-user Support**: Switch between different users seamlessly
- **User Preferences**: Customizable settings and themes
- **Theme Toggle**: Light and dark mode support
- **Local Storage**: Persistent user data and preferences

### 🎨 Modern UI/UX
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Material Design**: Clean, modern interface using Material-UI
- **Smooth Animations**: Framer Motion powered transitions
- **Accessibility**: Full keyboard navigation and screen reader support
- **Professional Colors**: Carefully chosen color scheme for optimal UX

## 🛠️ Technology Stack

- **Framework**: React 18 with Vite
- **UI Library**: Material-UI (MUI) v5
- **State Management**: React Context + Custom Hooks
- **Animations**: Framer Motion
- **HTTP Client**: Axios
- **Audio Recording**: MediaRecorder API
- **Styling**: Emotion (CSS-in-JS)
- **Icons**: Material Icons + Lucide React

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend server running (see backend README)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   Create a `.env` file in the frontend directory:
   ```env
   VITE_API_BASE_URL=http://127.0.0.1:8000
   VITE_DEFAULT_USER=testuser
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:5173`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://127.0.0.1:8000` |
| `VITE_DEFAULT_USER` | Default username | `testuser` |

### API Endpoints

The frontend integrates with these backend endpoints:

- `POST /recognise_text_to_llm` - Voice command processing
- `POST /update_wishlist/{username}` - Update wishlist
- `GET /wishlist/{username}` - Get user wishlist
- `GET /recommendations/{username}` - Get AI recommendations

## 🎯 Usage Guide

### Voice Commands

1. **Start Recording**: Click the "Start Recording" button
2. **Speak Clearly**: Say your shopping command (e.g., "Add 2 apples")
3. **Review**: Check the parsed command in the confirmation dialog
4. **Confirm**: Click "Confirm" to add to wishlist

### Example Voice Commands

- "Add 2 apples to my wishlist"
- "Remove milk from wishlist"
- "Add 3 bottles of orange juice"
- "Delete chocolate bar"
- "Add 1 kg rice"
- "Remove all bananas"

### Wishlist Management

- **Search**: Use the search bar to find specific items
- **Filter**: Select categories to filter wishlist items
- **Remove**: Click the delete icon on any item
- **Clear All**: Use the "Clear All" button to empty wishlist
- **Refresh**: Click "Refresh" to sync with backend

### User Management

- **Switch User**: Enter a new username and click "Switch User"
- **Settings**: Click the settings icon to access preferences
- **Theme**: Toggle between light and dark themes
- **Preferences**: Configure voice, notifications, and auto-refresh settings

## 📱 Responsive Design

The application is fully responsive and optimized for:

- **Desktop**: Full feature set with side-by-side layouts
- **Tablet**: Touch-friendly interface with adapted layouts
- **Mobile**: Optimized for voice commands and touch interactions

## 🔒 Security & Privacy

- **Audio Privacy**: Audio is processed locally and not stored
- **HTTPS Support**: Secure communication with backend
- **Input Validation**: Client-side validation for all inputs
- **Error Handling**: Graceful error handling without data exposure

## 🚀 Performance Optimizations

- **Lazy Loading**: Components load on demand
- **Caching**: Intelligent caching of wishlist and recommendations
- **Debounced Requests**: Prevents excessive API calls
- **Bundle Optimization**: Tree-shaking and code splitting
- **Image Optimization**: Optimized assets and icons

## 🧪 Testing

### Run Tests
```bash
npm run test
```

### Test Coverage
```bash
npm run test:coverage
```

## 📦 Build & Deploy

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Docker Deployment
```bash
# Build Docker image
docker build -t voice-shopping-frontend .

# Run container
docker run -p 3000:3000 voice-shopping-frontend
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Check the backend documentation
- Review the troubleshooting guide

## 🔄 Updates

Stay updated with the latest features and improvements:

- Watch the repository for updates
- Check the changelog for version history
- Follow the development roadmap

---

**Built with ❤️ using React, Material-UI, and modern web technologies**

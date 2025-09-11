# React Native Firebase Authentication Template

![Build](https://github.com/zainzafar/react-native-firebase-graphql-template/actions/workflows/ci.yml/badge.svg)

A production-ready React Native template with comprehensive Firebase authentication, including email/password, Google Sign-In, Apple Sign-In, and phone authentication. This template provides a solid foundation for building secure mobile applications with modern authentication flows.

## 🚀 Features

- **Multi-Platform Authentication**
  - Email & Password authentication
  - Google Sign-In (iOS & Android)
  - Apple Sign-In (iOS only)
  - Phone number authentication with SMS verification
  - Account linking detection

- **Production-Ready Architecture**
  - Centralized authentication logic in `AuthProvider`
  - Proper error handling for user cancellations
  - JWT token management with secure storage
  - GraphQL integration ready
  - TypeScript support

- **Developer Experience**
  - Environment-based configuration (development, staging, production)
  - Comprehensive error handling
  - Clean separation of concerns
  - Well-documented code structure

- **CI/CD & Deployment**
  - GitHub Actions workflows for automated testing
  - iOS and Android build automation with Fastlane
  - TestFlight and Google Play Store deployment
  - Flexible signing and keystore management
  - Smart build numbering and version management



## 🚀 Quick Start

For detailed setup instructions, see [SETUP.md](SETUP.md).

Get started quickly by cloning the repository, following the setup guide, and running the app.

### Release Checklist

- Ensure no secrets are committed (Firebase native files excluded; use env files)
- Mobile: `npm run lint && npm run typecheck && npm test`
- API: `npm run typecheck && npm run build`
- Update docs and `FEATURES.md` if features changed
- Tag and push; CI should pass on main and PRs



## 📁 Project Structure

The template follows a clean, modular architecture with:
- **Authentication logic** centralized in `AuthProvider`
- **Environment-based configuration** for different build targets
- **TypeScript support** throughout the codebase
- **GraphQL integration** ready for backend connectivity
- **CI/CD workflows** for automated testing and deployment

## 🔧 Customization

The template is designed to be easily customizable:
- **Add new authentication methods** by extending the `AuthProvider`
- **Customize UI and theming** through the theme system
- **Integrate with your backend** using the included GraphQL setup
- **Environment-specific builds** for development, staging, and production

## 🚨 Support

For setup issues, customization questions, or technical support, please refer to the [SETUP.md](SETUP.md) file or open an issue in the repository.

## 📝 License

This template is provided as-is for educational and commercial use. Please ensure compliance with Firebase and platform-specific terms of service.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

---

**Note**: This template includes dummy Firebase configuration files. Make sure to replace them with your actual Firebase project configuration before using in production.
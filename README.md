# Grid Strategy Frontend

A sophisticated web application for configuring and deploying Grid trading strategies on Raindex's onchain orderbook. Grid strategies place automated orders at fixed price intervals to capitalize on market volatility.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Web3 wallet (MetaMask, WalletConnect compatible)
- WalletConnect Project ID from [Reown Cloud](https://cloud.reown.com)

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd TheGridStrategy
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Update `.env` with your configuration:

   ```env
   # WalletConnect Project ID from https://cloud.reown.com
   PUBLIC_REOWN_PROJECT_ID=your_project_id_here
   PUBLIC_DEBUG_MODE=true
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

## 🎯 How to Use the Application

### 1. Connect Your Wallet

- Click "Connect Wallet" in the top right corner
- Choose your preferred wallet provider
- Confirm the connection in your wallet

### 2. Configure Your Grid Strategy

#### Token Selection

- **Token to Buy**: Select the token you want to purchase (input token)
- **Token to Sell**: Select the token you want to sell (output token)

#### Strategy Parameters

- **Baseline Price**: The starting price ratio (how much input token per output token)
- **Price Growth per Tranche**: The percentage increase between each grid level
- **Tranche Size**: The amount of output token allocated to each grid level
  **Optional Fields**
- **Deposit Amount**: Total amount of output token to deposit
- **Vault Id 1**: The vault id for Vault 1
- **Vault Id 2**: The vault id for Vault 2
- **Recharge Time**: Time for grid levels to automatically refill

#### Example Configuration

```
Token to Buy: USDC
Token to Sell: ETH
Baseline Price: 0.0003 ETH per USDC (≈$3,333 USD/ETH)
Price Growth: 2% per tranche
Tranche Size: 0.1 ETH
Deposit Amount: 1.0 ETH
Vault Id 1: 123
Vault Id 2: 321
```

### 3. Review Strategy Visualization

- View your grid levels in the interactive chart
- See potential returns if all levels execute
- Verify the price points and amounts

### 4. Deploy Your Strategy

- Click "Deploy Strategy"
- Review the transaction details
- Confirm in your wallet
- Wait for blockchain confirmation

### 5. Monitor Your Strategy

- View deployment status and transaction hash
- Access block explorer for detailed transaction info
- Monitor strategy performance (future feature)

## 🛠️ Development

### Available Scripts

#### Core Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production bundle
- `npm run preview` - Preview production build locally
- `npm run prepare` - Sync SvelteKit configuration

#### Code Quality

- `npm run check` - Run TypeScript and Svelte checks
- `npm run check:watch` - Run checks in watch mode
- `npm run format` - Format code with Prettier
- `npm run lint` - Check code formatting and run ESLint

#### Testing Suite

##### Quick Testing

- `npm run test` - Run all tests (unit + e2e)
- `npm run test:run` - Run tests once without watch mode
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Open Vitest UI for interactive testing

##### Comprehensive Testing

- `npm run test:coverage` - Run tests with coverage report
- `npm run test:e2e` - Run end-to-end tests with Playwright
- `npm run test:component` - Run component tests only
- `npm run test:unit` - Run unit tests only
- `npm run test:integration` - Run integration tests only

##### CI/CD Testing

- `npm run test:ci` - Run all tests for CI environment
- `npm run test:all` - Generate comprehensive test reports
- `npm run test:report` - Generate and view test reports
- `npm run test:report-open` - Generate reports and open in browser

##### Test Management

- `npm run clean-reports` - Clean up test result files
- `npm run generate-report` - Generate consolidated test report
- `npm run open-reports` - Open test reports in browser

#### Storybook

- `npm run storybook` - Start Storybook development server
- `npm run build-storybook` - Build Storybook for deployment

### Project Structure

```
src/
├── app.html              # Main HTML template
├── app.d.ts             # TypeScript declarations
├── lib/                 # Reusable components and utilities
│   ├── components/      # Svelte components
│   ├── stores/          # Svelte stores for state management
│   ├── utils/           # Utility functions
│   └── types/           # TypeScript type definitions
├── routes/              # SvelteKit routes
└── styles/              # Global styles and Tailwind CSS

tests/
├── unit/                # Unit tests
├── integration/         # Integration tests
└── e2e/                 # End-to-end tests

.storybook/              # Storybook configuration
stories/                 # Component stories
```

### Environment Configuration

Create a `.env` file with the following variables:

```env
# Required: WalletConnect Project ID
PUBLIC_REOWN_PROJECT_ID=your_project_id_here

# Optional: Development settings
PUBLIC_DEBUG_MODE=true
```

### Getting WalletConnect Project ID

1. Visit [Reown Cloud](https://cloud.reown.com)
2. Sign up or log in to your account
3. Create a new project
4. Copy the Project ID
5. Add it to your `.env` file as `PUBLIC_REOWN_PROJECT_ID`

## 🧪 Testing Strategy

### Test Categories

1. **Unit Tests** (`test:unit`)

   - Individual function testing
   - Utility function validation
   - Calculation logic verification

2. **Component Tests** (`test:component`)

   - Component rendering
   - User interaction testing
   - Props and state management

3. **Integration Tests** (`test:integration`)
   - SDK integration
   - Wallet connection flows
   - End-to-end user journeys

### Running Tests

```bash
# Quick test run
npm run test

# Development testing with UI
npm run test:ui

# Coverage report
npm run test:coverage

# Full CI testing
npm run test:ci
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
npm run build
npm run preview  # Test production build locally
```

## 🔧 Troubleshooting

### Common Issues

**Wallet Connection Failed**

- Verify `PUBLIC_REOWN_PROJECT_ID` is correctly set
- Check if your wallet supports WalletConnect v2
- Try refreshing the page and reconnecting

**Build Errors**

- Run `npm run check` to identify TypeScript issues
- Ensure all dependencies are installed: `npm install`
- Clear node_modules and reinstall if needed

**Test Failures**

- Run tests individually to isolate issues
- Check test coverage: `npm run test:coverage`
- Update snapshots if UI changes: `npm run test:update-snapshots`

### Development Tips

- Use `npm run test:watch` during development
- Run `npm run format` before committing
- Check `npm run lint` passes before pushing
- Use Storybook for component development

## 📚 Additional Resources

- [Raindex SDK Documentation](https://www.npmjs.com/package/@rainlanguage/orderbook)
- [Grid Trading Strategy Guide](https://b2broker.com/news/understanding-grid-trading-purpose-pros-cons/)
- [SvelteKit Documentation](https://kit.svelte.dev/docs)
- [Wagmi Documentation](https://wagmi.sh/)
- [WalletConnect Documentation](https://docs.walletconnect.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and add tests
4. Run the test suite: `npm run test`
5. Commit your changes: `git commit -m 'Add your feature'`
6. Push to the branch: `git push origin feature/your-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions and support:

- Open an issue on GitHub
- Check existing documentation
- Review test examples for usage patterns

---

_Built with ❤️ using SvelteKit, Tailwind CSS, and the Raindex SDK_

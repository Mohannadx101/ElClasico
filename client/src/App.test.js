import { render, screen, fireEvent, act } from '@testing-library/react';
import App from './App';
import axios from 'axios';

// MOCK AXIOS
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  defaults: { headers: { common: {} } }
}));

describe('ElClasico Unit Tests', () => {

  // Reset before every test
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    // Default GET return to avoid crashes
    axios.get.mockResolvedValue({ data: [] });
  });

  // GROUP 1: GUEST & BASIC RENDERING

  test('1. Renders Brand Name', async () => {
    await act(async () => { render(<App />); });
    expect(screen.getByText(/ElClasico/i)).toBeInTheDocument();
  });

  test('2. Renders Guest Sidebar Buttons', async () => {
    await act(async () => { render(<App />); });
    // Use findAllByText because "Tournaments" appears in sidebar AND header
    const tourneyBtns = await screen.findAllByText(/Tournaments/i);
    expect(tourneyBtns.length).toBeGreaterThan(0);
    expect(screen.getByText(/Live Matches/i)).toBeInTheDocument();
  });

  test('3. Guest cannot see Dashboard or Notifications', async () => {
    await act(async () => { render(<App />); });
    expect(screen.queryByText(/Dashboard/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Notifications/i)).not.toBeInTheDocument();
  });

  test('4. Renders Login Button for Guests', async () => {
    await act(async () => { render(<App />); });
    expect(screen.getByText(/Log In \/ Register/i)).toBeInTheDocument();
  });

  // GROUP 2: NAVIGATION

  test('5. Switches to Live Matches Tab', async () => {
    await act(async () => { render(<App />); });
    const liveBtn = screen.getByText(/Live Matches/i);
    
    await act(async () => { fireEvent.click(liveBtn); });
    
    // Check for unique text in Live Tab
    expect(screen.getByText(/World Football/i)).toBeInTheDocument();
    expect(screen.getByText(/Yesterday/i)).toBeInTheDocument();
  });

  test('6. Switches to Guess Player Tab', async () => {
    await act(async () => { render(<App />); });
    const guessBtn = screen.getByText(/Guess Player/i);
    
    await act(async () => { fireEvent.click(guessBtn); });
    
    // Check for unique text in Game Tab
    expect(screen.getByText(/Start/i)).toBeInTheDocument();
  });

  // GROUP 3: AUTHENTICATION FLOW

  test('7. Opens Auth Screen and Toggles Register', async () => {
    await act(async () => { render(<App />); });
    const sidebarLogin = screen.getByText(/Log In \/ Register/i);
    
    await act(async () => { fireEvent.click(sidebarLogin); });
    
    // Default is Login
    expect(screen.getAllByText('Login')[0]).toBeInTheDocument();
    
    // Click "Create Account"
    const toggleBtn = screen.getByText(/Create Account/i);
    await act(async () => { fireEvent.click(toggleBtn); });
    
    // Should now say Register
    expect(screen.getAllByText('Register')[0]).toBeInTheDocument();
  });

  // GROUP 4: ROLE BASED SECURITY

  test('8. Admin Login shows Admin Controls', async () => {
    const adminUser = { _id: '1', username: 'Boss', role: 'admin', coins: 100 };
    localStorage.setItem('user', JSON.stringify(adminUser));

    await act(async () => { render(<App />); });

    // Used getAllByText because it appears in Sidebar AND Dashboard Header
    const manageTeams = screen.getAllByText(/Manage Teams/i);
    expect(manageTeams.length).toBeGreaterThan(0);
    
    const manageTourneys = screen.getAllByText(/Manage Tournaments/i);
    expect(manageTourneys.length).toBeGreaterThan(0);
  });

  test('9. Manager Login shows Manager Controls', async () => {
    const managerUser = { _id: '2', username: 'Pep', role: 'manager', coins: 100 };
    localStorage.setItem('user', JSON.stringify(managerUser));

    await act(async () => { render(<App />); });

    // Used getAllByText because it appears in Sidebar AND Hero Card
    const squadBtns = screen.getAllByText(/My Squads/i);
    expect(squadBtns.length).toBeGreaterThan(0);
  });

  test('10. Manager CANNOT see Admin Controls', async () => {
    const managerUser = { _id: '2', username: 'Pep', role: 'manager', coins: 100 };
    localStorage.setItem('user', JSON.stringify(managerUser));

    await act(async () => { render(<App />); });

    expect(screen.queryByText(/Manage Teams/i)).not.toBeInTheDocument();
  });

  test('11. Admin CANNOT see My Squads', async () => {
    const adminUser = { _id: '1', username: 'Boss', role: 'admin', coins: 100 };
    localStorage.setItem('user', JSON.stringify(adminUser));

    await act(async () => { render(<App />); });
    
    const managerNav = screen.queryByRole('button', { name: /My Squads/i });
    expect(managerNav).not.toBeInTheDocument();
  });

  // GROUP 5: SYSTEM FEATURES

  test('12. Logged User sees Notifications', async () => {
    const user = { _id: '1', username: 'User', role: 'manager', coins: 100 };
    localStorage.setItem('user', JSON.stringify(user));

    await act(async () => { render(<App />); });

    expect(screen.getByText(/Notifications/i)).toBeInTheDocument();
  });

  test('13. Logged User sees Coin Balance', async () => {
    const user = { _id: '1', username: 'User', role: 'manager', coins: 500 };
    localStorage.setItem('user', JSON.stringify(user));

    await act(async () => { render(<App />); });

    expect(screen.getByText(/500 Coins/i)).toBeInTheDocument();
  });

  test('14. Logout Functionality', async () => {
    const user = { _id: '1', username: 'User', role: 'manager', coins: 100 };
    localStorage.setItem('user', JSON.stringify(user));

    await act(async () => { render(<App />); });
    
    const logoutBtn = screen.getByText(/Log Out/i);
    await act(async () => { fireEvent.click(logoutBtn); });

    // Should return to Guest View
    expect(screen.getByText(/Log In \/ Register/i)).toBeInTheDocument();
    expect(screen.queryByText(/Dashboard/i)).not.toBeInTheDocument();
  });

});
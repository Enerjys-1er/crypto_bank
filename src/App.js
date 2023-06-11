// Importing CSS files and necessary libraries
import './App.css';
import { useAccount } from 'wagmi'// Importing useAccount hook from 'wagmi' library
import { useState, useEffect } from 'react' // Importing useState and useEffect hooks from React
import { ethers } from 'ethers'; // Importing ethers library to interact with Ethereum blockchain
import { ConnectButton } from '@rainbow-me/rainbowkit'; // Importing ConnectButton component to enable user to connect to their Ethereum wallet
import { FaEthereum } from 'react-icons/fa'; // Importing Ethereum logo

// Importing the 'Bank' smart contract
import Bank from './artifacts/contracts/Bank.sol/Bank.json'

// Address of the 'Bank' smart contract on the Sepolia Ethereum network, on Hardhat : 0x5FbDB2315678afecb367f032d93F642f64180aa3
const BankAddress = "0xf83755cE557D8913b7F224F13911298eec38Fd88";

function App() {
  
  // Using the useAccount hook to retrieve the connected account's address
  const { address } = useAccount();

  // Initialising the application states using useState hook
  const [balance, setBalance] = useState(0); // User balance
  const [balanceContract, setBalanceContract] = useState(0); // Contract balance
  const [amountSend, setAmountSend] = useState(); // Amount to send
  const [amountWithdraw, setAmountWithdraw] = useState(); // Amount to withdraw
  const [events, setEvents] = useState([]); // Storing contract events
  const [error, setError] = useState(''); // Handling errors
  const [success, setSuccess] = useState(''); // Successful operation messages
  const [isLoading, setIsLoading] = useState(false); // Loading status
  const [isLoadingMsg, setIsLoadingMsg] = useState(''); // Loading message
  

  // Using useEffect hook to call getBalance and getEvents functions on page load
  useEffect(() => {
    getBalance();
    getEvents();
  }, [])

  // Function to get the user's and the contract's balance
  async function getBalance() {
    setIsLoading(true);
    setIsLoadingMsg("Fetch balance and events...");
    if (typeof window.ethereum !== 'undefined') {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(BankAddress, Bank.abi, provider);
      try {
        const dataB = await contract.getBalanceOfUser(address);
        const dataBC = await provider.getBalance(BankAddress);
        setBalance(String(dataB));
        setBalanceContract(String(dataBC));
        getEvents();
      }
      catch (err) {
        console.log(err);
        setError('Error during load balance and events');
      }
    }
    setIsLoading(false);
    setIsLoadingMsg("");

  }

  // Function to perform a transfer to the contract
  async function transfer() {
    if (!amountSend) {
      return;
    }
    setError('');
    setSuccess('');
    setIsLoading(true);
    setIsLoadingMsg("Transaction in progress...");

    if (typeof window.ethereum !== 'undefined') {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(BankAddress, Bank.abi, signer);
      try {
        const transaction = await contract.deposit({ value: ethers.utils.parseEther(amountSend) });
        await transaction.wait();
        setAmountSend('');
        getBalance();
        setSuccess('Your money has been transferred !')
      }
      catch (err) {
        setError('Erreur during transfer');
      }
    }
    setIsLoading(false);
    setIsLoadingMsg("");

  }
  
  // Function to perform a withdrawal from the contract
  async function withdraw() {
    if (!amountWithdraw) {
      return;
    }
    setError('');
    setSuccess('');
    setIsLoading(true);
    setIsLoadingMsg("Withdraw in progress...");
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(BankAddress, Bank.abi, signer);
    try {
      const transaction = await contract.withdrawMoney(ethers.utils.parseEther(amountWithdraw));
      await transaction.wait();
      setAmountWithdraw('');
      getBalance();
      setSuccess('Your money has been withdrawn !');
    }
    catch (err) {
      console.log(err);
      setError('Erreur during whisdraw');
    }
    setIsLoading(false);
    setIsLoadingMsg("");


  }

  // Function to update the amount to send
  function changeAmountSend(e) {
    setAmountSend(e.target.value);
  }

  // Function to update the amount to withdraw
  function changeAmountWithdraw(e) {
    setAmountWithdraw(e.target.value);
  }

  // Function to get contract's events
  async function getEvents() {
    if (typeof window.ethereum !== 'undefined') {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(BankAddress, Bank.abi, provider);
      const filterDeposit = contract.filters.etherDeposited(null, null);
      const filterWithdraw = contract.filters.etherWithdrawed(null, null);

      const depositEvents = await contract.queryFilter(filterDeposit);
      const withdrawEvents = await contract.queryFilter(filterWithdraw);

      const formattedEvents = [...depositEvents, ...withdrawEvents].map(log => {
        const parsed = contract.interface.parseLog(log);
        return {
          account: parsed.args.account,
          amount: (parsed.args.amount / 10 ** 18).toString(),
          type: parsed.name,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash
        };
      }).sort((a, b) => b.blockNumber - a.blockNumber); // sort by block number in descending order
      const lastTenEvents = formattedEvents.slice(0, 10); //display only 10 last events
      setEvents(lastTenEvents);
    }
  }

  // Rendering the application
  return (
    <div className="App">
      <ConnectButton />
      <h1>YOUR CRYPTO BANK</h1>
      <div>TOTAL BALANCE CONTRACT : {balanceContract / 10 ** 18} ETH </div>
      {isLoading && (
        <div className="popup">
          <div className="spinner-container">
            <div className="spinner"></div>
            <div className="message">{isLoadingMsg}</div>
          </div>
        </div>
      )}
      <div className="container">
        <div className="balance-container">
          <h2>{balance / 10 ** 18} <span className="eth">ETH</span></h2>
          <div className="logo">
            <FaEthereum />
          </div>
        </div>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <div className="wallet__flex">
          <div className="walletG">
            <h3>Send ETH</h3>
            <input type="text" placeholder="Amount of Ethers" onChange={changeAmountSend} />
            <button onClick={transfer}>SEND</button>
          </div>
          <div className="walletD">
            <h3>Withdraw ETH</h3>
            <input type="text" placeholder="Amount of Ethers" onChange={changeAmountWithdraw} />
            <button onClick={withdraw}>WITHDRAW</button>
          </div>
        </div>
        <br />
      </div>
      <div className="table-container">
        <h2 className='title-table'>Lasts Events</h2>
        <table className="event-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Account</th>
              <th>Amount</th>
              <th>Transaction Hash</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, index) => (
              <tr key={index}>
                <td>{event.type}</td>
                <td>{event.account}</td>
                <td>{event.amount}</td>
                <a href={`https://sepolia.etherscan.io/tx/${event.transactionHash}`} target="_blank" rel="noopener noreferrer" className="event-link">{event.transactionHash}</a> {/*link to TX inforamtions on etherscan  */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

}

// Exporting the App component
export default App;
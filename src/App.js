import './App.css';
import { useAccount } from 'wagmi'
import { useState, useEffect } from 'react'
import { ethers } from 'ethers';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { FaEthereum } from 'react-icons/fa';

import Bank from './artifacts/contracts/Bank.sol/Bank.json'

const BankAddress = "0xf83755cE557D8913b7F224F13911298eec38Fd88"; //address of contract on sepolia
// for hardhat : 0x5FbDB2315678afecb367f032d93F642f64180aa3

function App() {
  // WAGMI
  const { address } = useAccount();
  // USE STATE
  const [balance, setBalance] = useState(0);
  const [balanceContract, setBalanceContract] = useState(0);
  const [amountSend, setAmountSend] = useState();
  const [amountWithdraw, setAmountWithdraw] = useState();
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMsg, setIsLoadingMsg] = useState('');

  useEffect(() => {
    getBalance();
    getEvents();
  }, [])

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

  function changeAmountSend(e) {
    setAmountSend(e.target.value);
  }

  function changeAmountWithdraw(e) {
    setAmountWithdraw(e.target.value);
  }

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

export default App;
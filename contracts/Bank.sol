// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

///@title A Bank contract which allows users to deposit and then, withdraw ethers
///@author Enerjys 

contract Bank {

    struct Account {
        uint balance;
        uint lastDeposit;
    }

    mapping(address => Account) accounts;

    event etherDeposited(address indexed account, uint amount);
    event etherWithdrawed(address indexed account, uint amount);

    ///@dev Get the balance and the last deposit of the user
    ///@return Account The account (balance + last deposit) of the user
    function getBalanceAndLastDeposit() external view returns(Account memory) {
        return accounts[msg.sender];
    }

    ///@dev Allows the user to withdraw ethers from the smart contract 
    ///@param _amount The amount of ethers the user wants to withdraw
    function withdrawMoney(uint _amount) external {
        require(accounts[msg.sender].balance >= _amount, "Not enough funds");
        accounts[msg.sender].balance -= _amount;
        (bool received, ) = msg.sender.call{value: _amount}("");
        require(received, "An error occured");
        emit etherWithdrawed(msg.sender, _amount);
    }

    ///@dev Allows a user to deposit ethers on the smart contract
    function deposit() external payable {
        require(msg.value > 0, "Not enough funds deposited");
        accounts[msg.sender].balance += msg.value;
        accounts[msg.sender].lastDeposit = block.timestamp;
        emit etherDeposited(msg.sender, msg.value);
    }

    ///@dev Allows to get the amount of ethers the user has on the smart contract 
    ///@return uint The amount of ethers the user has on the smart contract
    function getBalanceOfUser(address _addr) external view returns(uint) {
        return accounts[_addr].balance;
    }

    fallback() external payable {
    }
}
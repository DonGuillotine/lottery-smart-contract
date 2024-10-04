// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract BasicLottery is Ownable, ReentrancyGuard {
    address payable[] public participants;
    uint256 public immutable minEntryFee;
    uint256 public immutable maxParticipants;
    uint256 public lotteryEndTime;

    event ParticipantEntered(address participant, uint256 amount);
    event WinnerPicked(address winner, uint256 amount);

    error InsufficientEntryFee();
    error LotteryIsFull();
    error LotteryHasEnded();
    error NoParticipants();
    error LotteryNotYetEnded();
    error FailedToSendEther();

    constructor(uint256 _minEntryFee, uint256 _maxParticipants, uint256 _lotteryDuration) Ownable(msg.sender) {
        minEntryFee = _minEntryFee;
        maxParticipants = _maxParticipants;
        lotteryEndTime = block.timestamp + _lotteryDuration;
    }

    function enter() external payable {
        if (msg.value < minEntryFee) revert InsufficientEntryFee();
        if (participants.length >= maxParticipants) revert LotteryIsFull();
        if (block.timestamp >= lotteryEndTime) revert LotteryHasEnded();

        participants.push(payable(msg.sender));
        emit ParticipantEntered(msg.sender, msg.value);
    }

    function pickWinner() external onlyOwner nonReentrant {
        if (participants.length == 0) revert NoParticipants();
        if (block.timestamp < lotteryEndTime) revert LotteryNotYetEnded();

        uint256 index = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, participants.length))) % participants.length;
        address payable winner = participants[index];
        uint256 prize = address(this).balance;

        (bool success, ) = winner.call{value: prize}("");
        if (!success) revert FailedToSendEther();

        emit WinnerPicked(winner, prize);

        delete participants;
        lotteryEndTime = block.timestamp + 7 days;
    }

    function getParticipants() external view returns (address payable[] memory) {
        return participants;
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getCurrentParticipantCount() external view returns (uint256) {
        return participants.length;
    }

    function getTimeLeft() external view returns (uint256) {
        if (block.timestamp >= lotteryEndTime) return 0;
        return lotteryEndTime - block.timestamp;
    }
}
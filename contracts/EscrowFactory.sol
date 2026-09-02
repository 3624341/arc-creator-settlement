// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./MilestoneEscrow.sol";

contract EscrowFactory {
    address public immutable usdc;
    address[] public escrows;

    event EscrowCreated(
        address indexed escrow,
        address indexed client,
        address indexed creator,
        string title,
        uint256 totalAmount
    );

    constructor(address _usdc) {
        require(_usdc != address(0), "USDC required");
        usdc = _usdc;
    }

    function createEscrow(
        address creator,
        string memory title,
        string[] memory milestoneDescriptions,
        uint256[] memory milestoneAmounts
    ) external returns (address escrow) {
        MilestoneEscrow instance = new MilestoneEscrow(
            msg.sender,
            creator,
            usdc,
            title,
            milestoneDescriptions,
            milestoneAmounts
        );
        escrow = address(instance);
        escrows.push(escrow);

        uint256 total;
        for (uint256 i = 0; i < milestoneAmounts.length; i++) total += milestoneAmounts[i];

        emit EscrowCreated(escrow, msg.sender, creator, title, total);
    }

    function escrowCount() external view returns (uint256) {
        return escrows.length;
    }
}

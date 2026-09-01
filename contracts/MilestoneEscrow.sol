// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract MilestoneEscrow {
    enum ContractStatus { Created, Funded, Completed, Cancelled }

    struct Milestone {
        string description;
        uint256 amount;
        bool submitted;
        bool approved;
        bool released;
    }

    IERC20 public immutable usdc;
    address public immutable client;
    address public immutable creator;
    string public title;
    uint256 public totalAmount;
    uint256 public releasedAmount;
    ContractStatus public status;

    Milestone[] private milestones;

    event FundsDeposited(address indexed client, uint256 amount);
    event MilestoneSubmitted(uint256 indexed milestoneId, string description, uint256 amount);
    event MilestoneApproved(uint256 indexed milestoneId, address indexed client);
    event PaymentReleased(uint256 indexed milestoneId, address indexed creator, uint256 amount);
    event ContractCompleted(address indexed escrow, uint256 totalReleased);
    event ContractCancelled(address indexed client, uint256 refundedAmount);

    error OnlyClient();
    error OnlyCreator();
    error InvalidMilestones();
    error InvalidMilestoneId();
    error NotFunded();
    error AlreadyFunded();
    error AlreadyReleased();
    error NotSubmitted();
    error TransferFailed();
    error CancelNotAllowed();

    modifier onlyClient() {
        if (msg.sender != client) revert OnlyClient();
        _;
    }

    modifier onlyCreator() {
        if (msg.sender != creator) revert OnlyCreator();
        _;
    }

    constructor(
        address _client,
        address _creator,
        address _usdc,
        string memory _title,
        string[] memory _descriptions,
        uint256[] memory _amounts
    ) {
        if (_client == address(0) || _creator == address(0) || _usdc == address(0)) revert InvalidMilestones();
        if (_descriptions.length == 0 || _descriptions.length != _amounts.length) revert InvalidMilestones();

        client = _client;
        creator = _creator;
        usdc = IERC20(_usdc);
        title = _title;
        status = ContractStatus.Created;

        for (uint256 i = 0; i < _amounts.length; i++) {
            if (_amounts[i] == 0) revert InvalidMilestones();
            milestones.push(Milestone({
                description: _descriptions[i],
                amount: _amounts[i],
                submitted: false,
                approved: false,
                released: false
            }));
            totalAmount += _amounts[i];
        }
    }

    function deposit() external onlyClient {
        if (status != ContractStatus.Created) revert AlreadyFunded();
        bool ok = usdc.transferFrom(msg.sender, address(this), totalAmount);
        if (!ok) revert TransferFailed();
        status = ContractStatus.Funded;
        emit FundsDeposited(msg.sender, totalAmount);
    }

    function submitMilestone(uint256 milestoneId) external onlyCreator {
        if (status != ContractStatus.Funded) revert NotFunded();
        Milestone storage milestone = _milestone(milestoneId);
        if (milestone.released) revert AlreadyReleased();
        milestone.submitted = true;
        emit MilestoneSubmitted(milestoneId, milestone.description, milestone.amount);
    }

    function approveAndRelease(uint256 milestoneId) external onlyClient {
        if (status != ContractStatus.Funded) revert NotFunded();
        Milestone storage milestone = _milestone(milestoneId);
        if (!milestone.submitted) revert NotSubmitted();
        if (milestone.released) revert AlreadyReleased();

        milestone.approved = true;
        milestone.released = true;
        releasedAmount += milestone.amount;

        emit MilestoneApproved(milestoneId, msg.sender);

        bool ok = usdc.transfer(creator, milestone.amount);
        if (!ok) revert TransferFailed();
        emit PaymentReleased(milestoneId, creator, milestone.amount);

        if (releasedAmount == totalAmount) {
            status = ContractStatus.Completed;
            emit ContractCompleted(address(this), releasedAmount);
        }
    }

    function cancelBeforeFunding() external onlyClient {
        if (status != ContractStatus.Created) revert CancelNotAllowed();
        status = ContractStatus.Cancelled;
        emit ContractCancelled(msg.sender, 0);
    }

    function getMilestone(uint256 milestoneId) external view returns (
        string memory description,
        uint256 amount,
        bool submitted,
        bool approved,
        bool released
    ) {
        Milestone storage milestone = _milestone(milestoneId);
        return (milestone.description, milestone.amount, milestone.submitted, milestone.approved, milestone.released);
    }

    function milestoneCount() external view returns (uint256) {
        return milestones.length;
    }

    function _milestone(uint256 milestoneId) internal view returns (Milestone storage milestone) {
        if (milestoneId >= milestones.length) revert InvalidMilestoneId();
        return milestones[milestoneId];
    }
}

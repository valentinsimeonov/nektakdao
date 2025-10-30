// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
//contracts/NektakTokenUpgradeable.sol

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/NoncesUpgradeable.sol"; // Import for nonces override

contract NektakTokenUpgradeable is
    Initializable,
    // Note the corrected inheritance list:
    ERC20PermitUpgradeable, // Inherits ERC20Upgradeable
    ERC20VotesUpgradeable, // Inherits ERC20Upgradeable
    OwnableUpgradeable,
    UUPSUpgradeable
    // We removed ERC20Upgradeable to avoid redundant inheritance
{
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(string memory name_, string memory symbol_) public initializer {
        __ERC20_init(name_, symbol_);
        __ERC20Permit_init(name_);
        __ERC20Votes_init(); // FIXED: Added missing initializer
        __Ownable_init(msg.sender); // Initialize Ownable with the deployer
        __UUPSUpgradeable_init();
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    // === REQUIRED OVERRIDES for OZ v5 ===

    /**
     * @dev Overrides {ERC20Upgradeable-_update} and {ERC20VotesUpgradeable-_update}.
     * This is required in OZ v5 when inheriting from both.
     */
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20Upgradeable, ERC20VotesUpgradeable)
    {
        super._update(from, to, value);
    }

    /**
     * @dev Overrides {ERC20PermitUpgradeable-nonces} and {NoncesUpgradeable-nonces}.
     * This is required because both ERC20Permit and Votes (via EIP712) inherit NoncesUpgradeable.
     */
    function nonces(address owner)
        public
        view
        override(ERC20PermitUpgradeable, NoncesUpgradeable)
        returns (uint256)
    {
        return super.nonces(owner);
    }

    // REMOVED _afterTokenTransfer, _mint, and _burn overrides.
    // The _update override above correctly handles the logic for ERC20Votes.

    // authorize UUPS upgrades via owner
    // IMPORTANT: In production, you MUST transfer ownership to the Timelock contract.
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}



























// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

//contracts/NektakGovernorUpgradeable.sol

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/governance/TimelockControllerUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/GovernorUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorSettingsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorCountingSimpleUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesQuorumFractionUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorTimelockControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/governance/utils/IVotes.sol";

contract NektakGovernorUpgradeable is
    Initializable,
    GovernorSettingsUpgradeable,
    GovernorCountingSimpleUpgradeable,
    GovernorVotesQuorumFractionUpgradeable,
    GovernorTimelockControlUpgradeable,
    UUPSUpgradeable
{
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address tokenAddr,
        address payable timelockAddr
    ) public initializer {
        __Governor_init("Nektak Governor");
        __GovernorSettings_init(1, 5, 0);
        __GovernorCountingSimple_init();
        __GovernorVotes_init(IVotes(tokenAddr));
        __GovernorVotesQuorumFraction_init(4);
        __GovernorTimelockControl_init(TimelockControllerUpgradeable(timelockAddr));
        __UUPSUpgradeable_init();
    }

    // === Required Overrides (from Diamond Inheritance) ===
    
    function votingDelay()
        public
        view
        // Defined in GovernorUpgradeable, Overridden in GovernorSettingsUpgradeable
        override(GovernorSettingsUpgradeable, GovernorUpgradeable)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        // Defined in GovernorUpgradeable, Overridden in GovernorSettingsUpgradeable
        override(GovernorSettingsUpgradeable, GovernorUpgradeable)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
        public
        view
        // Defined in GovernorUpgradeable, Overridden in GovernorVotesQuorumFractionUpgradeable
        override(GovernorVotesQuorumFractionUpgradeable, GovernorUpgradeable)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function state(uint256 proposalId)
        public
        view
        // Defined in GovernorUpgradeable, Overridden in GovernorTimelockControlUpgradeable
        override(GovernorTimelockControlUpgradeable, GovernorUpgradeable)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function proposalThreshold()
        public
        view
        // Defined in GovernorUpgradeable, Overridden in GovernorSettingsUpgradeable
        override(GovernorSettingsUpgradeable, GovernorUpgradeable)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
        // Defined in GovernorUpgradeable, Overridden in GovernorTimelockControlUpgradeable
    ) internal override(GovernorTimelockControlUpgradeable, GovernorUpgradeable) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        // Defined in GovernorUpgradeable, Overridden in GovernorTimelockControlUpgradeable
        override(GovernorTimelockControlUpgradeable, GovernorUpgradeable)
        returns (address)
    {
        return super._executor();
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
        // Defined in GovernorUpgradeable, Overridden in GovernorTimelockControlUpgradeable
    ) internal override(GovernorTimelockControlUpgradeable, GovernorUpgradeable) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
        // Defined in GovernorUpgradeable, Overridden in GovernorTimelockControlUpgradeable
    ) internal override(GovernorTimelockControlUpgradeable, GovernorUpgradeable) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function proposalNeedsQueuing(uint256 proposalId)
        public
        view
        // Defined in GovernorUpgradeable, Overridden in GovernorTimelockControlUpgradeable
        override(GovernorTimelockControlUpgradeable, GovernorUpgradeable)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

/**
     * @dev Final attempt to resolve supportsInterface diamond conflict by 
     * overriding the only contract consistently allowed in the Governor hierarchy.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(GovernorUpgradeable) 
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    // --- End of Overrides ---

    function _authorizeUpgrade(address) internal view override {
        require(msg.sender == address(timelock()), "Governor: only timelock can upgrade");
    }
}




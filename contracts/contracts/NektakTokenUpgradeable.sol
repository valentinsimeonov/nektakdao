// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
// contracts/NektakTokenUpgradeable.sol

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/NoncesUpgradeable.sol";

contract NektakTokenUpgradeable is
    Initializable,
    ERC20Upgradeable,
    ERC20PermitUpgradeable,
    ERC20VotesUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(string memory name_, string memory symbol_) public initializer {
        __ERC20_init(name_, symbol_);
        __ERC20Permit_init(name_);
        __ERC20Votes_init();
        // Many OZ v5 versions expect an initialOwner argument:
        // If your node_modules shows `function __Ownable_init(address initialOwner)` then use the line below:
        __Ownable_init(msg.sender);
        // If instead your OZ shows `function __Ownable_init()` then change to: __Ownable_init();
        __UUPSUpgradeable_init();
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    // === Required overrides for ERC20 + ERC20Votes + ERC20Permit/Nonces ===

    // _update is used by ERC20Votes for checkpoints; both ERC20Upgradeable and ERC20VotesUpgradeable
    // have definitions which requires the derived contract to explicitly override.
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20Upgradeable, ERC20VotesUpgradeable)
    {
        super._update(from, to, value);
    }

    // nonces() is present in both ERC20PermitUpgradeable and NoncesUpgradeable -> override conflict
    function nonces(address owner)
        public
        view
        override(ERC20PermitUpgradeable, NoncesUpgradeable)
        returns (uint256)
    {
        return super.nonces(owner);
    }

    // UUPS authorization (owner must be Timelock in production)
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
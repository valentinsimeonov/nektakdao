// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/governance/TimelockControllerUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title TimelockControllerUpgradeable with UUPS
 * @dev Extends OpenZeppelin's TimelockControllerUpgradeable with UUPS upgrade pattern
 */
contract TimelockControllerUpgradeableUUPS is 
    Initializable,
    TimelockControllerUpgradeable,
    UUPSUpgradeable
{
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the timelock with given parameters
     * @param minDelay Initial minimum delay for operations
     * @param proposers Accounts to be granted proposer role
     * @param executors Accounts to be granted executor role
     * @param admin Optional account to be granted admin role
     *
     * Note: TimelockControllerUpgradeable (the base) defines an `initialize(...)` function
     * marked `virtual`, so we must add `override` here.
     */
    function initialize(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) public override initializer {
        __TimelockController_init(minDelay, proposers, executors, admin);
        __UUPSUpgradeable_init();
    }

    /**
     * @dev Authorizes upgrade to new implementation
     * Only accounts with DEFAULT_ADMIN_ROLE can upgrade
     */
    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {}
}
// contracts/ERC1967ProxyWrapper.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/// @notice Simple wrapper so Hardhat can compile/deploy a proxy by name
contract ERC1967ProxyWrapper is ERC1967Proxy {
    constructor(address _logic, bytes memory _data) ERC1967Proxy(_logic, _data) {}
}


// SPDX-License-Identifier: MIT
//contracts/contracts/NektakToken.sol

//TEST CONTRACT



pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";



/// @notice ERC20 token with voting capabilities (ERC20Votes)
contract NektakToken is ERC20, ERC20Permit, ERC20Votes, Ownable {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) ERC20Permit(name) {
        // initial supply intentionally zero. Mint via admin or governance.
    }

    /// @notice mint function - controlled by owner (deployer) for testing/bootstrap.
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    // The following functions are overrides required by Solidity for ERC20Votes
    function _afterTokenTransfer(address from, address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._burn(account, amount);
    }
}




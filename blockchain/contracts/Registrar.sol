// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {SplitPayout} from "./helpers/SplitPayout.sol";
import {MembershipPass1155} from "./MembershipPass1155.sol";

/**
 * @title Registrar
 * @notice Deploys SplitPayout contracts and wires new courses into MembershipPass1155.
 */
contract Registrar is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    MembershipPass1155 public immutable membership;
    IERC20 public immutable payoutToken;
    address public marketplace;

    event CourseRegistered(
        uint256 indexed courseId,
        address indexed splitter,
        uint256 price,
        address indexed creator,
        uint64 duration,
        uint64 transferCooldown
    );

    constructor(MembershipPass1155 membershipContract, IERC20 payoutToken_, address admin) {
        require(address(membershipContract) != address(0), "Membership address zero");
        require(address(payoutToken_) != address(0), "Payout token address zero");

        membership = membershipContract;
        payoutToken = payoutToken_;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    function setMarketplace(address marketplaceAddress) external onlyRole(ADMIN_ROLE) {
        require(marketplaceAddress != address(0), "Marketplace address zero");
        marketplace = marketplaceAddress;
    }

    function registerCourse(
        uint256 courseId,
        uint256 price,
        address[] calldata recipients,
        uint32[] calldata sharesBps,
        uint64 duration,
        uint64 transferCooldown
    ) external returns (address splitterAddress) {
        SplitPayout splitter = new SplitPayout(
            address(membership),
            marketplace,
            payoutToken,
            recipients,
            sharesBps
        );
        splitterAddress = address(splitter);

        membership.createCourse(courseId, price, splitterAddress, msg.sender, duration, transferCooldown);

        emit CourseRegistered(courseId, splitterAddress, price, msg.sender, duration, transferCooldown);
    }
}

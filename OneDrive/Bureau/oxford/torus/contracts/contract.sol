// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DiscordLogger {
    struct Message {
        string content;      // Contenu du message
        string authorId;     // ID Discord de l'auteur (au lieu d'une adresse Ethereum)
        uint256 timestamp;   // Timestamp du message
        string serverId;     // ID du serveur Discord
    }

    Message[] public messages; // Tableau pour stocker les messages
    address public owner;      // Propriétaire du contrat (le bot)

    // Modifier pour restreindre l'accès au propriétaire
    modifier onlyOwner() {
        require(msg.sender == owner, "Seul le proprietaire peut appeler cette fonction");
        _;
    }

    // Constructeur : définit le propriétaire du contrat
    constructor() {
        owner = msg.sender;
    }

    // Fonction pour ajouter un message (seul le propriétaire peut l'appeler)
    function addMessage(
        string memory content,
        string memory authorId,
        string memory serverId
    ) public onlyOwner {
        messages.push(Message(content, authorId, block.timestamp, serverId));
    }

    // Fonction pour récupérer un message par son index
    function getMessage(uint256 index) public view returns (
        string memory content,
        string memory authorId,
        uint256 timestamp,
        string memory serverId
    ) {
        require(index < messages.length, "Index invalide");
        Message memory message = messages[index];
        return (message.content, message.authorId, message.timestamp, message.serverId);
    }

    // Fonction pour récupérer tous les messages
    function getAllMessages() public view returns (Message[] memory) {
        return messages;
    }

    // Fonction pour récupérer les messages d'un serveur spécifique
    function getMessagesByServer(string memory serverId) public view returns (Message[] memory) {
        Message[] memory serverMessages = new Message[](messages.length);
        uint256 count = 0;

        for (uint256 i = 0; i < messages.length; i++) {
            if (keccak256(abi.encodePacked(messages[i].serverId)) == keccak256(abi.encodePacked(serverId))) {
                serverMessages[count] = messages[i];
                count++;
            }
        }

        // Redimensionne le tableau pour supprimer les cases vides
        Message[] memory result = new Message[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = serverMessages[i];
        }

        return result;
    }
}
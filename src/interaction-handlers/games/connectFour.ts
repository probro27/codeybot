import {
  InteractionHandler,
  InteractionHandlerTypes,
  Maybe,
  PieceContext,
} from '@sapphire/framework';
import { ButtonInteraction } from 'discord.js';
import { getEmojiByName } from '../../components/emojis';
import {
  getCodeyConnectFourSign,
  ConnectFourGameSign,
  connectFourGameTracker,
  updateColumn,
} from '../../components/games/connectFour';
import { updateMessageEmbed } from '../../utils/embeds';

export class ConnectFourHandler extends InteractionHandler {
  public constructor(ctx: PieceContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button,
    });
  }

  // Get the game info and the interaction type
  public override parse(interaction: ButtonInteraction): Maybe<{
    gameId: number;
    sign: number;
  }> {
    if (!interaction.customId.startsWith('connect4')) return this.none();
    const parsedCustomId = interaction.customId.split('-');
    const sign = parseInt(parsedCustomId[1]);
    const gameId = parseInt(parsedCustomId[2]);

    console.log('sign: ---' + parsedCustomId[1]);

    return this.some({
      gameId: gameId,
      sign: sign,
    });
  }

  public async run(
    interaction: ButtonInteraction,
    result: { gameId: number; sign: ConnectFourGameSign },
  ): Promise<void> {
    if (
      interaction.user.id !== connectFourGameTracker.getGameFromId(result.gameId)!.state.player1Id
    ) {
      return await interaction.reply({
        content: `This isn't your game! ${getEmojiByName('codey_angry')}`,
        ephemeral: true,
      });
    }
    connectFourGameTracker.runFuncOnGame(result.gameId, (game) => {
      updateColumn(game.state.columns[result.sign], game.state.player1Sign);
      // If single player, get Codey's sign
      if (!game.state.player2Id) {
        console.log('@@@@@@@@@');
        updateColumn(game.state.columns[getCodeyConnectFourSign()], game.state.player2Sign);
        // game.setStatus(undefined);
      }
      console.log(game.state.columns);
      updateMessageEmbed(game.gameMessage, game.getGameResponse());
    });
    connectFourGameTracker.endGame(result.gameId);
  }
}

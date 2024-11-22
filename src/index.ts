/**
 * @author Junaid Atari <mj.atari@gmail.com>
 * @see https://github.com/jiifw/node-ts-boilerplate
 * @link https://github.com/blacksmoke26 Author Website
 * @since 2022-07-23
 */

// App
import { fromApp } from '@root/app';

// Bootstrapper
(async (): Promise<void> => {
  console.log(await fromApp());
})();

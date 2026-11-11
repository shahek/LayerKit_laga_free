import { Config } from '@remotion/cli/config';

// Transparent output defaults: ProRes 4444 with alpha
Config.setVideoImageFormat('png');
Config.setPixelFormat('yuva444p10le');
Config.setCodec('prores');
Config.setProResProfile('4444');

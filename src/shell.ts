import { runNodeConsole, INodeConsoleMatch, reply } from 'prague-nodeconsole';
import { IStateMatch } from 'prague-nodeconsole';
import 'isomorphic-fetch';

// Add state to your bot here:

interface BotData {
    vip?: boolean,
    promptKey?: string
}

const botData: BotData = {
}

type B = IStateMatch<BotData> & INodeConsoleMatch;

import { matchRegExp, re, IRegExpMatch } from 'prague-nodeconsole';
import { first, rule, run } from 'prague-nodeconsole';

// LUIS

import { LuisModel } from 'prague-nodeconsole';

// WARNING: don't check your LUIS id/key in to your repo!

const luis = new LuisModel('id', 'key');

// Prompts

import { PromptRules, TextPrompts } from 'prague-nodeconsole';

const promptRules: PromptRules<B> = {
    'Comment': rule<B>(
            match => fetch(`https://jsonplaceholder.typicode.com/comments/${match.text}`)
                .then(response => response.json())
                .then(json => match.reply(json.name))
        )
}

const prompts = new TextPrompts<B>(
    promptRules,
    (match) => match.data.promptKey,
    (match, promptKey) => {
        match.data.promptKey = promptKey
    }
);

const introRule = rule(
    matchRegExp(/I am (.*)/i),
    first<B & IRegExpMatch>(
        rule<B & IRegExpMatch>(match => match.groups[1] === 'Bill', match => {
            match.reply(`You are very handsome, ${match.groups[1]}`);
            match.data.vip = true;
        }),
        match => {
            match.reply(`Nice to meet you, ${match.groups[1]}`);
            match.data.vip = false;
        }
    )
);

const appRule = first<B>(

    prompts,

    re<B>(/show comment/, match => {
        match.reply("Which comment would you like to see (0-99)?");
        prompts.setPrompt(match, 'Comment');
    }),

    introRule,

    luis.best<B>({
        'singASong': match =>
            match.reply(`Let's sing ${match.entityValues('song')[0]}`),
        'findSomething': match =>
            match.reply(`Okay let's find a ${match.entityValues('what')[0]} in ${match.entityValues('where')[0]}`)
    }),

    re<B>(/Howdy|Hi|Hello|Wassup/i, match => match.reply("Howdy")),

    match => match.reply(`I don't understand you${ match.data.vip ? ", sir" : ""}.`),

);

runNodeConsole(appRule.prependMatcher<INodeConsoleMatch>(match => ({
    ... match as any,
    data: botData
} as B)));


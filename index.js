// -- IMPORTS --

import { h, app } from 'hyperapp'
import { Http } from 'hyperapp-fx'
import { interval } from '@hyperapp/time'

// -- ACTIONS --

const FetchStories = state => [
    { ...state, fetching: true },
    Http({
        url: `https://zaceno.github.io/hatut/data/${state.filter.toLowerCase()}.json`,
        response: 'json',
        action: GotStories,
    }),
]

const StartEditingFilter = state => ({ ...state, editingFilter: true })

const StopEditingFilter = state =>
    FetchStories({ ...state, editingFilter: false })

const SetFilter = (state, word) => ({ ...state, filter: word })

const SelectStory = (state, id) => ({
    ...state,
    reading: id,
    stories: {
        ...state.stories,
        [id]: {
            ...state.stories[id],
            seen: true,
        },
    },
})

const GotStories = (state, response) => {
    const stories = {}
    Object.keys(response).forEach(id => {
        stories[id] = { ...response[id], seen: false }
        if (state.stories[id] && state.stories[id].seen) {
            stories[id].seen = true
        }
    })
    const reading = stories[state.reading] ? state.reading : null
    return {
        ...state,
        stories,
        reading,
        fetching: false,
    }
}

const ToggleAutoUpdate = state => ({ ...state, autoUpdate: !state.autoUpdate })

// -- VIEWS ---

const emphasize = (word, string) =>
    string.split(' ').map(x => {
        if (x.toLowerCase() === word.toLowerCase()) {
            return h('b', {}, x + ' ')
        } else {
            return x + ' '
        }
    })

const StoryThumbnail = props =>
    h(
        'li',
        {
            onClick: [SelectStory, props.id],
            class: {
                unread: props.unread,
                reading: props.reading,
            },
        },
        [
            h('p', { class: 'title' }, emphasize(props.filter, props.title)),
            h('small', { class: 'author' }, props.author),
        ]
    )

const StoryList = props =>
    h('div', { class: 'stories' }, [
        props.fetching &&
            h('div', { class: 'loadscreen' }, [h('div', { class: 'spinner' })]),

        h(
            'ul',
            {},
            Object.keys(props.stories).map(id =>
                StoryThumbnail({
                    id,
                    title: props.stories[id].title,
                    author: props.stories[id].author,
                    unread: !props.stories[id].seen,
                    reading: props.reading === id,
                    filter: props.filter,
                })
            )
        ),
    ])

const Filter = props =>
    h('div', { class: {
      filter: true,
      editing: props.editingFilter
    } }, [

        h('input', {
            type: 'text',
            value: props.filter,
            onInput: [SetFilter, event => event.target.value], // <----
            onClick: StartEditingFilter,
        }),

        h('button', { onClick: props.editingFilter ? StopEditingFilter : StartEditingFilter }, 'Go')
    ])

const StoryDetail = props =>
    h('div', { class: 'story' }, [
        props && h('h1', {}, props.title),
        props &&
            h(
                'p',
                {},
                `
        Lorem ipsum dolor sit amet, consectetur adipiscing
        elit, sed do eiusmod tempor incididunt ut labore et
        dolore magna aliqua. Ut enim ad minim veniam, qui
        nostrud exercitation ullamco laboris nisi ut aliquip
        ex ea commodo consequat.
      `
            ),
        props && h('p', { class: 'signature' }, props.author),
    ])

const AutoUpdate = props =>
    h('div', { class: 'autoupdate' }, [
        'Auto update: ',
        h('input', {
            type: 'checkbox',
            checked: props.autoUpdate, // <---
            onInput: ToggleAutoUpdate, // <---
        }),
    ])

const Container = content => h('div', { class: 'container' }, content)

// -- RUN --

app({
    node: document.getElementById('app'),
    view: state =>
        Container([
            Filter(state),
            StoryList(state),
            AutoUpdate(state),
            state.reading && StoryDetail(state.stories[state.reading]),
        ]),
    init: FetchStories({
        editingFilter: false,
        autoUpdate: false,
        filter: 'ocean',
        reading: null,
        stories: {},
    }),
    subscriptions: state => [
        state.autoUpdate && interval(FetchStories, { delay: 5000 }),
    ],
})

import { describe, it, expect } from 'vitest'
import { classifyMessage, routeMessage } from '../src/router.js'

describe('classifyMessage', () => {
  // -- Light tier: only truly trivial messages --------------------------------

  it('classifies short greetings as light', () => {
    expect(classifyMessage('hi')).toBe('light')
    expect(classifyMessage('Hello')).toBe('light')
    expect(classifyMessage('hey')).toBe('light')
    expect(classifyMessage('Good morning')).toBe('light')
    expect(classifyMessage('gm')).toBe('light')
  })

  it('classifies acknowledgements as light', () => {
    expect(classifyMessage('ok')).toBe('light')
    expect(classifyMessage('thanks')).toBe('light')
    expect(classifyMessage('got it')).toBe('light')
    expect(classifyMessage('sounds good')).toBe('light')
    expect(classifyMessage('yep')).toBe('light')
    expect(classifyMessage('noted')).toBe('light')
  })

  it('classifies social closers as light', () => {
    expect(classifyMessage('bye')).toBe('light')
    expect(classifyMessage('good night')).toBe('light')
    expect(classifyMessage('ttyl')).toBe('light')
  })

  it('does NOT classify longer messages as light even if they start with a greeting', () => {
    expect(classifyMessage('hey can you check my calendar and see what I have tomorrow')).not.toBe('light')
    expect(classifyMessage('morning, I need help figuring out my schedule for the week')).not.toBe('light')
  })

  // -- Standard tier: default for most messages -------------------------------

  it('classifies tool-related requests as standard', () => {
    expect(classifyMessage('check my email')).toBe('standard')
    expect(classifyMessage('what meetings do I have today')).toBe('standard')
    expect(classifyMessage('show me overdue tasks')).toBe('standard')
    expect(classifyMessage('any new emails?')).toBe('standard')
  })

  it('classifies moderate questions as standard', () => {
    expect(classifyMessage('can you help me with something')).toBe('standard')
    expect(classifyMessage('what did I have for lunch yesterday')).toBe('standard')
    expect(classifyMessage('remind me to call Sarah at 3pm')).toBe('standard')
  })

  it('defaults ambiguous messages to standard', () => {
    expect(classifyMessage('I need to figure out my taxes')).toBe('standard')
    expect(classifyMessage('send that email to John')).toBe('standard')
  })

  // -- Heavy tier: depth signals detected ------------------------------------

  it('classifies deep coaching questions as heavy', () => {
    expect(classifyMessage('should I take this job offer or stay where I am')).toBe('heavy')
    expect(classifyMessage('help me think through this deal with the investor')).toBe('heavy')
    expect(classifyMessage('what do you think about my approach to pricing')).toBe('heavy')
  })

  it('classifies planning and reviews as heavy', () => {
    expect(classifyMessage('plan my day')).toBe('heavy')
    expect(classifyMessage('weekly review')).toBe('heavy')
    expect(classifyMessage('debrief')).toBe('heavy')
  })

  it('classifies strategy and business thinking as heavy', () => {
    expect(classifyMessage('help me restructure this deal')).toBe('heavy')
    expect(classifyMessage('what is the best business model for a consulting practice')).toBe('heavy')
    expect(classifyMessage('help me negotiate this contract')).toBe('heavy')
  })

  it('classifies long narrative messages as heavy based on length and structure', () => {
    const longMessage = 'So basically here is what happened. I had a call with the investor today and he said the valuation was too high. He wants to come in at 2M but I think we are worth at least 3.5M based on our traction. I am not sure if I should counter or walk away. The thing is he has connections in the industry that could help us scale faster. What would you do?'
    expect(classifyMessage(longMessage)).toBe('heavy')
  })

  it('classifies emotional or reflective messages as heavier', () => {
    expect(classifyMessage('I have been thinking about whether this path is right for me and I am feeling stuck')).toBe('heavy')
  })

  it('classifies writing requests with depth as heavy', () => {
    expect(classifyMessage('write me a LinkedIn post about my journey from employee to founder')).toBe('heavy')
    expect(classifyMessage('draft a pitch for investors about our sustainability platform')).toBe('heavy')
  })

  // -- Media: always at least standard ----------------------------------------

  it('routes media messages to standard minimum', () => {
    expect(classifyMessage('', true)).toBe('standard')
    expect(classifyMessage('check this', true)).toBe('standard')
  })

  it('routes media with long context to heavy', () => {
    const longCaption = 'Here is a screenshot of my conversation with the investor. He is pushing back on the equity split and I need you to help me figure out how to respond. The key issue is that he wants 30% but we originally agreed on 15%. I think we have leverage because our MRR grew 40% last month.'
    expect(classifyMessage(longCaption, true)).toBe('heavy')
  })

  // -- Edge cases -------------------------------------------------------------

  it('handles empty input as standard', () => {
    expect(classifyMessage('')).toBe('standard')
  })

  it('handles single word non-trivial as standard', () => {
    expect(classifyMessage('calendar')).toBe('standard')
    expect(classifyMessage('email')).toBe('standard')
  })
})

describe('routeMessage', () => {
  it('returns haiku for light', () => {
    const route = routeMessage('hi')
    expect(route.tier).toBe('light')
    expect(route.model).toContain('haiku')
    expect(route.maxThinkingTokens).toBeLessThanOrEqual(1024)
  })

  it('returns sonnet with moderate thinking for standard', () => {
    const route = routeMessage('check my email')
    expect(route.tier).toBe('standard')
    expect(route.model).toContain('sonnet')
    expect(route.maxThinkingTokens).toBe(8000)
  })

  it('returns sonnet with full thinking for heavy', () => {
    const route = routeMessage('should I take this deal or walk away')
    expect(route.tier).toBe('heavy')
    expect(route.model).toContain('sonnet')
    expect(route.maxThinkingTokens).toBe(16000)
  })

  it('passes hasMedia through', () => {
    const route = routeMessage('look at this screenshot', true)
    expect(route.tier).not.toBe('light')
  })
})

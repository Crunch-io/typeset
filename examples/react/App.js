import React, { Component } from 'react';
import { Paragraph } from './Paragraph';

const p1 = "Alice was beginning to get very tired of sitting by her sister on \
the bank, and of having nothing to do. Once or twice she had peeped into the \
book her sister was reading, but it had no pictures or conversations in it, \
\"and what is the use of a book,\" thought Alice, \"without pictures or \
conversations?\""

const header = [
  "THE HISTORY OF HERODOTUS",
  "BOOK I",
  "THE FIRST BOOK OF THE HISTORIES, CALLED CLIO"
]

export class App extends Component {

  constructor() {
    super();
    this.state = {
      poll: true,
      header: 0,
      tag: Paragraph
    };
    // setInterval(
    //   () => this.setState({ tag: this.state.tag === 'p' ? Paragraph : 'p' }),
    //   3000
    // );
    // setInterval(
    //   () => this.setState({ header: (this.state.header + 1) % 3 }),
    //   3000
    // );
  }

  render() {
    return (<div>
      {React.createElement(
        this.state.tag,
        {
          style: {hyphens: 'auto'},
          poll: this.state.poll
        },
        [
          <b>Line breaking</b>,
          ', also known as ',
          <b>word wrapping</b>,
          ', is the process of breaking a section of text into lines such that it will fit in the available width of a page, window or other display area. In text display, ',
          <b>line wrap</b>,
          ' is the feature of continuing on a new line when a line is full, such that each line fits in the viewable window, allowing text to be read from top to bottom without any horizontal ',
          <a href="https://en.wikipedia.org/wiki/Scrolling">scrolling</a>,
          '. ',
          <b>Word wrap</b>,
          ' is the additional feature of most ',
          <a href="https://en.wikipedia.org/wiki/Text_editor">text editors</a>,
          ', ',
          <a href="https://en.wikipedia.org/wiki/Word_processors">word processors</a>,
          ', and ',
          <a href="https://en.wikipedia.org/wiki/Web_browser">web browsers</a>,
          ', of breaking lines between words rather than within words, when possible. Word wrap makes it unnecessary to hard-code newline delimiters within ',
          <a href="https://en.wikipedia.org/wiki/Paragraph">paragraphs</a>,
          ', and allows the display of text to adapt flexibly and dynamically to displays of varying sizes.'
        ].map((e,key) => typeof e === 'object' ? {...e, key} : e)
      )}
    </div>);
  }

}


      // <Paragraph style={{textAlign: 'justify', fontFamily: 'Hoefler Text'}} poll={true}>
      //   This is the Showing forth of the Inquiry of Herodotus of Halicarnassos, to the end that neither the deeds of men may be forgotten by lapse of time, nor the works great and marvellous, which have been produced some by Hellenes and some by Barbarians, may lose their renown; and especially that the causes may be remembered for which these waged war with one another.
      // </Paragraph>
      // <Paragraph style={{textAlign: 'justify', fontFamily: 'Hoefler Text'}} poll={false}>
      //   Those of the Persians who have knowledge of history declare that the Phenicians first began the quarrel. These, they say, came from that which is called the Erythraian Sea to this of ours; and having settled in the land where they continue even now to dwell, set themselves forthwith to make long voyages by sea. And conveying merchandise of Egypt and of Assyria they arrived at other places and also at Argos; now Argos was at that time in all points the first of the States within that land which is now called Hellas;--the Phenicians arrived then at this land of Argos, and began to dispose of their ship's cargo: and on the fifth or sixth day after they had arrived, when their goods had been almost all sold, there came down to the sea a great company of women, and among them the daughter of the king; and her name, as the Hellenes also agree, was Io the daughter of Inachos. These standing near to the stern of the ship were buying of the wares such as pleased them most, when of a sudden the Phenicians, passing the word from one to another, made a rush upon them; and the greater part of the women escaped by flight, but Io and certain others were carried off. So they put them on board their ship, and forthwith departed, sailing away to Egypt.
      // </Paragraph>
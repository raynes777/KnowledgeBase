package document;
import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;

import org.junit.Before;
import org.junit.Test;

import content.Author;
import content.Content;
import content.StringContent;

public class DocumentTests {
	Document document;
	Document secondDocument;

	@Before
	public void setup() {
		StringContent.builder contentBuilder = StringContent.builder.get() ;
		 Author gabibbo = Author.getNewAuthor("Il Gabibbo");
		 Author ceccherini = Author.getNewAuthor("Massimo Ceccherini");
		 
			Content<String> DocumentTitle = contentBuilder.withAuthor(gabibbo).withContent("Libro del gabibbo").build();
			document = DummyDocument.newFromContent(DocumentTitle);
						
			Content<String> secondDocumentTitle = contentBuilder.withAuthor(ceccherini).withContent("Libro di Ceccherini").build();
			
			secondDocument = DummyDocument.newFromContent(secondDocumentTitle);
			
			
			
	}
	
	@Test
	public void testWrite() {
		document.write("primo capitolo libro del gabibbo");
		assertThat(document.getCurrentNode().content().show()).isEqualTo("primo capitolo libro del gabibbo");
		
	}
	
	
	@Test
	public void testTransclude() {
		document.transclude(secondDocument.getCurrentNode());
		assertThat(document.getCurrentNode().content().show()).isEqualTo(secondDocument.getCurrentNode());
		ByteArrayOutputStream baos = new ByteArrayOutputStream();
		PrintStream ps = new PrintStream(baos);
		System.setOut(ps);
		document.draw();
		ps.flush();
		ps.close();
		String result = baos.toString();
		assertThat(result).isEqualTo("Libro del gabibbo\nLibro di Ceccherini\n");
	}
	
}
